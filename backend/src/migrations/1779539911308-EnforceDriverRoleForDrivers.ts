import { MigrationInterface, QueryRunner } from "typeorm";

export class EnforceDriverRoleForDrivers1779539911308 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create a function that checks if a user has the 'driver' role
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_user_is_driver()
      RETURNS TRIGGER AS $$
      DECLARE
        has_driver_role BOOLEAN;
      BEGIN
        -- Check if the user has a role named 'driver' (case-insensitive)
        SELECT EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = NEW.user_id
            AND LOWER(r.name) = 'driver'
        ) INTO has_driver_role;

        IF NOT has_driver_role THEN
          RAISE EXCEPTION 'User with id % does not have the "driver" role', NEW.user_id;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. Attach the trigger to the drivers table (before insert/update)
    await queryRunner.query(`
      CREATE TRIGGER enforce_driver_role_trigger
      BEFORE INSERT OR UPDATE OF user_id ON drivers
      FOR EACH ROW
      EXECUTE FUNCTION check_user_is_driver();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the trigger and the function
    await queryRunner.query(`DROP TRIGGER IF EXISTS enforce_driver_role_trigger ON drivers;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS check_user_is_driver();`);
  }
}
