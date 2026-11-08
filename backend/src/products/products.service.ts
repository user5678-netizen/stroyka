import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, ILike } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Product } from '../shared/entities/product.entity';
import {
  GetProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  PaginatedProductsResponseDto,
  SortBy,
  SortOrder,
} from './dto/products.dto';
import { User, UserRole } from '../shared/entities/user.entity';
import { CloudinaryService } from '../shared/services/cloudinary.service';
import { CreateProductWithFilesDto } from './dto/create-product-with-files.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cloudinaryService: CloudinaryService,
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

    // Create cache key based on query parameters
    const cacheKey = `products:${JSON.stringify(query)}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<PaginatedProductsResponseDto>(
      cacheKey,
    );
    if (cached) {
      return cached;
    }

    // Build query
    const where: any = {};

    if (search) {
      where.title = ILike(`%${search}%`);
    }

    if (min_price !== undefined || max_price !== undefined) {
      where.price = Between(
        min_price || 0,
        max_price || Number.MAX_SAFE_INTEGER,
      );
    }

    if (min_rating !== undefined) {
      where.rating = Between(min_rating, 5);
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const total_items = await this.productRepository.count({ where });

    // Get products with sorting
    const [products, count] = await this.productRepository.findAndCount({
      where,
      order: {
        [sort_by]: order,
      },
      skip,
      take: limit,
    });

    const response: PaginatedProductsResponseDto = {
      items: products.map((product) => ({
        id: product.id,
        title: product.title,
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

    // Cache the result (TTL: 120 seconds)
    await this.cacheManager.set(cacheKey, response, 120);

    return response;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(
    createProductDto: CreateProductDto,
    user: User,
  ): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    await this.productRepository.save(product);

    // Invalidate products cache
    await this.invalidateProductsCache();

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: User,
  ): Promise<Product> {
    const product = await this.findOne(id);

    Object.assign(product, updateProductDto);
    await this.productRepository.save(product);

    // Invalidate products cache
    await this.invalidateProductsCache();

    return product;
  }

  async delete(id: string, user: User): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);

    // Invalidate products cache
    await this.invalidateProductsCache();
  }

  private async invalidateProductsCache(): Promise<void> {
    // Get all cache keys starting with 'products:'
    const keys = await this.cacheManager.store.keys?.('products:*');
    if (keys?.length) {
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    }
  }
}