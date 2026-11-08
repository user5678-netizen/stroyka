import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1720000000000 implements MigrationInterface {
  name = 'CreateInitialTables1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for user role
    await queryRunner.query(`
      CREATE TYPE user_role_enum AS ENUM ('customer', 'admin');
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role user_role_enum DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        rating FLOAT DEFAULT 0,
        images TEXT[] NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create promo_codes table
    await queryRunner.query(`
      CREATE TABLE promo_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percentage DECIMAL(5, 2) NOT NULL,
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Create carts table
    await queryRunner.query(`
      CREATE TABLE carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        promo_code VARCHAR(50),
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create cart_items table
    await queryRunner.query(`
      CREATE TABLE cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        CONSTRAINT unique_cart_product UNIQUE(cart_id, product_id)
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
      CREATE INDEX idx_products_price ON products(price);
      CREATE INDEX idx_products_rating ON products(rating);
      CREATE INDEX idx_products_created_at ON products(created_at);
      CREATE INDEX idx_carts_user_id ON carts(user_id);
      CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
      CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
    `);

    // Insert default promo codes
    await queryRunner.query(`
      INSERT INTO promo_codes (id, code, discount_percentage, is_active)
      VALUES 
        (gen_random_uuid(), 'SAVE10', 10.00, true),
        (gen_random_uuid(), 'BUILD10', 10.00, true),
        (gen_random_uuid(), 'WELCOME15', 15.00, true)
      ON CONFLICT (code) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query('DROP TABLE IF EXISTS cart_items');
    await queryRunner.query('DROP TABLE IF EXISTS carts');
    await queryRunner.query('DROP TABLE IF EXISTS promo_codes');
    await queryRunner.query('DROP TABLE IF EXISTS products');
    await queryRunner.query('DROP TABLE IF EXISTS users');
    
    // Drop enum type
    await queryRunner.query('DROP TYPE IF EXISTS user_role_enum');
    
    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS idx_users_email');
    await queryRunner.query('DROP INDEX IF EXISTS idx_users_role');
    await queryRunner.query('DROP INDEX IF EXISTS idx_products_price');
    await queryRunner.query('DROP INDEX IF EXISTS idx_products_rating');
    await queryRunner.query('DROP INDEX IF EXISTS idx_products_created_at');
    await queryRunner.query('DROP INDEX IF EXISTS idx_carts_user_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_cart_items_cart_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_cart_items_product_id');
  }
}