import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { CartItem } from './cart-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('float', { default: 0 })
  rating: number;

  @Column('simple-array')
  images: string[]; // Cloudinary URLs (minimum 3 images)

  @Column({ default: 0 })
  stock_quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  // Helper method to get price as number
  getPrice(): number {
    return parseFloat(this.price.toString());
  }
}