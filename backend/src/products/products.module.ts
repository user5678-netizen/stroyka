import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from '../shared/entities/product.entity';
import { CartItem } from '../shared/entities/cart-item.entity';
import { CloudinaryService } from '../shared/services/cloudinary.service';
import { CatalogCacheService } from '../shared/services/catalog-cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, CartItem])],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService, CatalogCacheService],
  exports: [ProductsService],
})
export class ProductsModule {}