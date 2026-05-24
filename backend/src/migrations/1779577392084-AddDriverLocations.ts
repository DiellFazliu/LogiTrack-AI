import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddDriverLocations1779577392084 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Krijo tabelën driver_locations
    await queryRunner.createTable(new Table({
      name: 'driver_locations',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'driver_id', type: 'uuid', isNullable: false },
        { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: false },
        { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: false },
        { name: 'address', type: 'text', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // Shto foreign key
    await queryRunner.createForeignKey('driver_locations', new TableForeignKey({
      columnNames: ['driver_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'drivers',
      onDelete: 'CASCADE',
    }));

    // Shto indeks për performancë
    await queryRunner.createIndex('driver_locations', new TableIndex({
      name: 'idx_driver_locations_driver_created',
      columnNames: ['driver_id', 'created_at'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('driver_locations');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('driver_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('driver_locations', foreignKey);
    }
    await queryRunner.dropIndex('driver_locations', 'idx_driver_locations_driver_created');
    await queryRunner.dropTable('driver_locations');
  }
}