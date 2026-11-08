import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../shared/entities/user.entity';
import { Product } from '../shared/entities/product.entity';
import { Cart } from '../shared/entities/cart.entity';
import { CartItem } from '../shared/entities/cart-item.entity';
import { PromoCode } from '../shared/entities/promo-code.entity';
import {
  CartItemDto,
  UpdateCartItemDto,
  ApplyPromoDto,
  CartResponseDto,
} from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(PromoCode)
    private promoCodeRepository: Repository<PromoCode>,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user_id: userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      cart = this.cartRepository.create({
        user_id: userId,
        items: [],
        discount_amount: 0,
      });

      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    return this.mapCartToResponse(cart);
  }

  async addItem(
    userId: string,
    cartItemDto: CartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    const { product_id, quantity } = cartItemDto;

    // Check if product exists and has stock
    const product = await this.productRepository.findOne({
      where: { id: product_id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = cart.items.find((item) => item.product_id === product_id);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    if (product.stock_quantity < nextQuantity) {
      throw new BadRequestException('Insufficient stock');
    }

    let cartItem = existing;

    if (cartItem) {
      cartItem.quantity = nextQuantity;
    } else {
      // Create new item
      cartItem = this.cartItemRepository.create({
        cart,
        cart_id: cart.id,
        product,
        product_id,
        quantity,
      });
      cart.items.push(cartItem);
    }

    await this.cartItemRepository.save(cartItem);
    await this.syncDiscount(cart);
    await this.cartRepository.save(cart);

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    const { quantity } = updateCartItemDto;

    // Find item in cart
    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException('Item not found in cart');
    }

    // Check stock
    if (cartItem.product.stock_quantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    cartItem.quantity = quantity;
    await this.cartItemRepository.save(cartItem);
    await this.syncDiscount(cart);
    await this.cartRepository.save(cart);

    return this.getCart(userId);
  }

  async removeItem(
    userId: string,
    itemId: string,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    // Find item index
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    // Remove item
    await this.cartItemRepository.remove(cart.items[itemIndex]);
    cart.items.splice(itemIndex, 1);
    await this.syncDiscount(cart);
    await this.cartRepository.save(cart);

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);

    // Remove all items
    await this.cartItemRepository.remove(cart.items);
    cart.items = [];
    cart.promo_code = null;
    cart.discount_amount = 0;

    await this.cartRepository.save(cart);
  }

  async applyPromo(
    userId: string,
    applyPromoDto: ApplyPromoDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    const code = applyPromoDto.code.trim().toUpperCase();

    // Check if cart is empty
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate promo code
    const promoCode = await this.promoCodeRepository.findOne({
      where: { code, is_active: true },
    });

    if (!promoCode) {
      throw new BadRequestException('Invalid promo code');
    }

    // Calculate discount
    cart.promo_code = code;
    await this.syncDiscount(cart);
    await this.cartRepository.save(cart);

    return this.getCart(userId);
  }

  async removePromo(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    cart.promo_code = null;
    cart.discount_amount = 0;

    await this.cartRepository.save(cart);

    return this.mapCartToResponse(cart);
  }

  private async syncDiscount(cart: Cart): Promise<void> {
    if (!cart.promo_code || cart.items.length === 0) {
      cart.promo_code = null;
      cart.discount_amount = 0;
      return;
    }

    const promoCode = await this.promoCodeRepository.findOne({
      where: { code: cart.promo_code, is_active: true },
    });

    if (!promoCode) {
      cart.promo_code = null;
      cart.discount_amount = 0;
      return;
    }

    const subtotal = cart.calculateTotal();
    const percent = Number(promoCode.discount_percentage);
    cart.discount_amount = Math.round(((subtotal * percent) / 100) * 100) / 100;
  }

  private mapCartToResponse(cart: Cart): CartResponseDto {
    const subtotal = Math.round(cart.calculateTotal() * 100) / 100;
    const discountAmount = Number(cart.discount_amount) || 0;
    const total = cart.calculateTotalWithDiscount();
    const discountPercentage =
      discountAmount > 0 && subtotal > 0
        ? Math.round((discountAmount / subtotal) * 10000) / 100
        : 0;

    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          title: item.product.title,
          price: item.product.getPrice(),
          image: item.product.images[0] || '',
        },
        quantity: item.quantity,
        line_total: item.lineTotal,
      })),
      subtotal,
      promo_code: cart.promo_code,
      discount_amount: discountAmount,
      discount_percentage: Math.round(discountPercentage * 100) / 100,
      total,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
    };
  }
}