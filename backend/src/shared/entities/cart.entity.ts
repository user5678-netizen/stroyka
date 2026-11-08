import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.carts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    cascade: true,
  })
  items: CartItem[];

  @Column({ nullable: true })
  promo_code: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @CreateDateColumn()
  updated_at: Date;

  // Calculate total price
  calculateTotal(): number {
    return this.items.reduce((total, item) => {
      return total + item.product.getPrice() * item.quantity;
    }, 0);
  }

  // Calculate total with discount
  calculateTotalWithDiscount(): number {
    const total = this.calculateTotal();
    return Math.max(0, total - this.discount_amount);
  }
}