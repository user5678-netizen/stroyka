import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('promo_codes')
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // e.g., SAVE10

  @Column('decimal', { precision: 5, scale: 2 })
  discount_percentage: number; // e.g., 10.00 for 10%

  @Column({ default: true })
  is_active: boolean;
}