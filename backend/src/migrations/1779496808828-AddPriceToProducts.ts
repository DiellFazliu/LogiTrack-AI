import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPriceToProducts1779496808828 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('products', new TableColumn({
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            default: 0,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('products', 'price');
    }
}