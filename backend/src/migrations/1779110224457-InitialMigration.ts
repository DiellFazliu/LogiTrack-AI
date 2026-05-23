import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitialMigration1779110224457 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."organizations_plan_type_enum" AS ENUM('free', 'basic', 'pro', 'enterprise')
    `);
    
    await queryRunner.query(`
      CREATE TYPE "public"."organizations_subscription_status_enum" AS ENUM('active', 'inactive', 'trial', 'expired')
    `);

    // 2. Krijo tabelën organizations
    await queryRunner.createTable(new Table({
      name: 'organizations',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar', isNullable: false },
        { name: 'email', type: 'varchar', isNullable: false },
        { name: 'phone', type: 'varchar', isNullable: true },
        { name: 'address', type: 'text', isNullable: true },
        { name: 'plan_type', type: 'enum', enum: ['free', 'basic', 'pro', 'enterprise'], default: "'free'" },
        { name: 'subscription_status', type: 'enum', enum: ['active', 'inactive', 'trial', 'expired'], default: "'trial'" },
        { name: 'subscription_ends_at', type: 'timestamp', isNullable: true },
        { name: 'max_users', type: 'int', default: 5 },
        { name: 'max_shipments_per_month', type: 'int', default: 100 },
        { name: 'logo_url', type: 'varchar', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // 3. Krijo tabelën users (PA kolonën role)
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'email', type: 'varchar', isNullable: false, isUnique: true },
        { name: 'password', type: 'varchar', isNullable: false },
        { name: 'name', type: 'varchar', isNullable: false },
        { name: 'organization_id', type: 'uuid', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'phone', type: 'varchar', isNullable: true },
        { name: 'last_login', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // 4. Shto foreign key
    await queryRunner.createForeignKey('users', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'SET NULL',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('users', 'FK_organization_id');
    await queryRunner.dropTable('users');
    await queryRunner.dropTable('organizations');
    await queryRunner.query(`DROP TYPE "public"."organizations_subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_plan_type_enum"`);
  }
}
