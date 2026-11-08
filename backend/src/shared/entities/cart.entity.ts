import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
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

  @ManyToOne(() => User, (user) => user.carts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    cascade: true,
  })
  items: CartItem[];

  @Column({ nullable: true })
  promo_code?: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  calculateTotal(): number {
    return this.items.reduce((total, item) => {
      return total + item.product.getPrice() * item.quantity;
    }, 0);
  }

  calculateTotalWithDiscount(): number {
    const total = this.calculateTotal();
    const discount = Number(this.discount_amount) || 0;
    return Math.max(0, Math.round((total - discount) * 100) / 100);
  }
}