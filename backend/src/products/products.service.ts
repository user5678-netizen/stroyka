import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../shared/entities/product.entity';
import { CartItem } from '../shared/entities/cart-item.entity';
import {
  GetProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  PaginatedProductsResponseDto,
  SortBy,
  SortOrder,
} from './dto/products.dto';
import { CatalogCacheService } from '../shared/services/catalog-cache.service';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private catalogCache: CatalogCacheService,
  ) {}

  async findAll(
    query: GetProductsQueryDto,
  ): Promise<PaginatedProductsResponseDto> {
    const {
      page = 1,
      limit = 12,
      search,
      min_price,
      max_price,
      min_rating,
      sort_by = SortBy.TITLE,
      order = SortOrder.ASC,
    } = query;

    const cacheKey = this.catalogCache.buildKey({
      page,
      limit,
      search,
      min_price,
      max_price,
      min_rating,
      sort_by,
      order,
    });

    const cached = await this.catalogCache.get<PaginatedProductsResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (search) {
      const escaped = search.replace(/[\\%_]/g, '\\$&');
      queryBuilder.andWhere(
        "(product.title ILIKE :search ESCAPE '\\' OR product.description ILIKE :search ESCAPE '\\')",
        { search: `%${escaped}%` },
      );
    }

    if (min_price !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: min_price });
    }

    if (max_price !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: max_price });
    }

    if (min_rating !== undefined) {
      queryBuilder.andWhere('product.rating >= :minRating', {
        minRating: min_rating,
      });
    }

    const sortColumn = sort_by === SortBy.PRICE ? 'product.price' : 'product.title';
    queryBuilder.orderBy(sortColumn, order === SortOrder.DESC ? 'DESC' : 'ASC');

    // Get total count
    const total_items = await queryBuilder.getCount();

    // Add pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get products
    const products = await queryBuilder.getMany();

    const response: PaginatedProductsResponseDto = {
      items: products.map((product) => ({
        id: product.id,
        title: product.title,
        category: product.category,
        description: product.description,
        price: product.getPrice(),
        rating: product.rating,
        images: product.images,
        stock_quantity: product.stock_quantity,
        created_at: product.created_at,
      })),
      meta: {
        total_items,
        total_pages: Math.ceil(total_items / limit),
        current_page: page,
        limit,
      },
    };

    await this.catalogCache.set(cacheKey, response, 120);

    return response;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    await this.productRepository.save(product);
    await this.catalogCache.invalidateCatalog();
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    Object.assign(product, updateProductDto);
    await this.productRepository.save(product);
    await this.catalogCache.invalidateCatalog();
    return product;
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.cartItemRepository.delete({ product_id: id });
    await this.productRepository.delete(id);
    await this.catalogCache.invalidateCatalog();
  }
}