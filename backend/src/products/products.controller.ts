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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import {
  GetProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from './dto/products.dto';
import { User, UserRole } from '../shared/entities/user.entity';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';

@ApiTags('Products')
@Controller('api/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

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
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.getPrice(),
      rating: product.rating,
      images: product.images,
      stock_quantity: product.stock_quantity,
      created_at: product.created_at,
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
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
    return {
      id: product.id,
      title: product.title,
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
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.getPrice(),
      rating: product.rating,
      images: product.images,
      stock_quantity: product.stock_quantity,
      created_at: product.created_at,
    };
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