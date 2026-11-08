import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import {
  CartItemDto,
  UpdateCartItemDto,
  ApplyPromoDto,
  CartResponseDto,
} from './dto/cart.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: CartResponseDto,
  })
  async getCart(@Req() req: { user: { id: string } }): Promise<CartResponseDto> {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  async addItem(
    @Req() req: { user: { id: string } },
    @Body() cartItemDto: CartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(req.user.id, cartItemDto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  async updateItem(
    @Req() req: { user: { id: string } },
    @Param('id') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(
      req.user.id,
      itemId,
      updateCartItemDto,
    );
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed successfully',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  async removeItem(
    @Req() req: { user: { id: string } },
    @Param('id') itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  @Post('apply-promo')
  @ApiOperation({ summary: 'Apply promo code to cart' })
  @ApiResponse({
    status: 200,
    description: 'Promo code applied successfully',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid promo code or empty cart' })
  async applyPromo(
    @Req() req: { user: { id: string } },
    @Body() applyPromoDto: ApplyPromoDto,
  ): Promise<CartResponseDto> {
    return this.cartService.applyPromo(req.user.id, applyPromoDto);
  }

  @Delete('remove-promo')
  @ApiOperation({ summary: 'Remove promo code from cart' })
  @ApiResponse({
    status: 200,
    description: 'Promo code removed successfully',
    type: CartResponseDto,
  })
  async removePromo(
    @Req() req: { user: { id: string } },
  ): Promise<CartResponseDto> {
    return this.cartService.removePromo(req.user.id);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({
    status: 204,
    description: 'Cart cleared successfully',
  })
  async clearCart(@Req() req: { user: { id: string } }): Promise<void> {
    return this.cartService.clearCart(req.user.id);
  }
}