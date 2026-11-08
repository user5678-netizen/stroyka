import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PromoCode } from './entities/promo-code.entity';
import { Product } from './entities/product.entity';
import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, PromoCode, Product])],
  providers: [BootstrapService],
})
export class BootstrapModule {}
