import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { User } from '../shared/entities/user.entity';
import { Product } from '../shared/entities/product.entity';
import { Cart } from '../shared/entities/cart.entity';
import { CartItem } from '../shared/entities/cart-item.entity';
import { PromoCode } from '../shared/entities/promo-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Cart, CartItem, PromoCode]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}