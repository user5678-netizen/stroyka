import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ParseUUIDPipe,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import {
  GetProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from './dto/products.dto';
import { CreateProductWithFilesDto } from './dto/create-product-with-files.dto';
import { User, UserRole } from '../shared/entities/user.entity';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { CloudinaryService } from '../shared/services/cloudinary.service';
import {
  imageFileFilter,
  limits,
  validateUploadedFiles,
} from '../shared/utils/file-validation.utils';

@ApiTags('Products')
@Controller('api/products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiQuery({ type: GetProductsQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: PaginatedProductsResponseDto,
  })
  async findAll(
    @Query() query: GetProductsQueryDto,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    return this.toResponse(product);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product with image URLs (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Req() req: { user: User },
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.create(
      createProductDto,
      req.user,
    );
    return this.toResponse(product);
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a product and upload images to Cloudinary (Admin only)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'price', 'images'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        rating: { type: 'number' },
        stock_quantity: { type: 'number' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          minItems: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created with Cloudinary images',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid files or payload' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @UseInterceptors(
    FilesInterceptor('images', limits.files, {
      fileFilter: imageFileFilter,
      limits: { fileSize: limits.fileSize },
    }),
  )
  async createWithUpload(
    @Body() dto: CreateProductWithFilesDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: { user: User },
  ): Promise<ProductResponseDto> {
    validateUploadedFiles(files);

    let imageUrls: string[];
    try {
      imageUrls = await this.cloudinaryService.uploadMultipleImages(files);
    } catch (error) {
      throw new BadRequestException(
        `Cloudinary upload failed: ${(error as Error).message}`,
      );
    }

    const product = await this.productsService.create(
      {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        rating: dto.rating ?? 0,
        stock_quantity: dto.stock_quantity ?? 0,
        images: imageUrls,
      },
      req.user,
    );

    return this.toResponse(product);
  }

  private toResponse(product: {
    id: string;
    title: string;
    category: string;
    description: string;
    getPrice: () => number;
    rating: number;
    images: string[];
    stock_quantity: number;
    created_at: Date;
  }): ProductResponseDto {
    return {
      id: product.id,
      title: product.title,
      category: product.category,
      description: product.description,
      price: product.getPrice(),
      rating: product.rating,
      images: product.images,
      stock_quantity: product.stock_quantity,
      created_at: product.created_at,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: { user: User },
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(
      id,
      updateProductDto,
      req.user,
    );
    return this.toResponse(product);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (Admin only)' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: User },
  ): Promise<void> {
    return this.productsService.delete(id, req.user);
  }
}