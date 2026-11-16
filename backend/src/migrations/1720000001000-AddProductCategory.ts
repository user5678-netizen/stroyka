import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategory1720000001000 implements MigrationInterface {
  name = 'AddProductCategory1720000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS category VARCHAR(255) NOT NULL DEFAULT 'General';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS category;
    `);
  }
}
