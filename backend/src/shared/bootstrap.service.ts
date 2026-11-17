import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { PromoCode } from './entities/promo-code.entity';
import { Product } from './entities/product.entity';

/** Каталог демонстрационных товаров. Все изображения лежат в Cloudinary (см. scripts/product-images.json). */
const FRONTEND_CATALOG: Array<{
  title: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  stock_quantity: number;
  images: string[];
}> = [
  {
    title: 'Exterior Paint Set',
    category: 'Paint & Coatings',
    price: 45.99,
    rating: 3.5,
    stock_quantity: 80,
    images: [
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863678/stroyka/products/exterior-paint-set/1-paint-can.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866570/stroyka/products/exterior-paint-set/2-paint-roller.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866573/stroyka/products/exterior-paint-set/3-painted-interior.jpg',
    ],
    description:
      'Professional-grade exterior paint set designed to withstand harsh weather conditions. This premium paint offers excellent coverage, durability, and color retention. Perfect for residential and commercial applications.',
  },
  {
    title: 'Plywood Sheets',
    category: 'Wood & Lumber',
    price: 52.99,
    rating: 4.5,
    stock_quantity: 120,
    images: [
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863679/stroyka/products/plywood-sheets/1-plywood-board.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794900110/stroyka/products/plywood-sheets/2-plywood-sheets.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794899897/stroyka/products/plywood-sheets/3-plywood-panels.jpg',
    ],
    description:
      'Versatile construction-grade plywood sheets suitable for a wide range of applications. These sheets are engineered for strength and dimensional stability, perfect for subfloors, roofing, walls, and general construction.',
  },
  {
    title: 'Premium Cement Bags',
    category: 'Cement & Concrete',
    price: 24.99,
    rating: 5,
    stock_quantity: 200,
    images: [
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863679/stroyka/products/premium-cement-bags/1-cement-warehouse.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866575/stroyka/products/premium-cement-bags/2-concrete-site.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794899901/stroyka/products/premium-cement-bags/3-cement-bags.jpg',
    ],
    description:
      'High-quality Portland cement bags designed for heavy-duty construction projects. Our premium cement offers exceptional strength, durability, and workability. Ideal for foundations, structural work, and general concrete applications.',
  },
  {
    title: 'Premium Lumber Planks',
    category: 'Wood & Lumber',
    price: 89.99,
    rating: 4.5,
    stock_quantity: 90,
    images: [
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863680/stroyka/products/premium-lumber-planks/1-lumber-stack.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866571/stroyka/products/premium-lumber-planks/2-carpentry-workshop.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866572/stroyka/products/premium-lumber-planks/3-miter-saw.jpg',
    ],
    description:
      'Premium kiln-dried lumber planks perfect for all your woodworking and construction needs. These high-grade wooden planks are carefully selected for strength and appearance.',
  },
  {
    title: 'Red Clay Bricks',
    category: 'Bricks & Blocks',
    price: 0.89,
    rating: 4,
    stock_quantity: 5000,
    images: [
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863681/stroyka/products/red-clay-bricks/1-brick-stack.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866576/stroyka/products/red-clay-bricks/2-brick-renovation.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794899965/stroyka/products/red-clay-bricks/3-brick-pallet.jpg',
    ],
    description:
      'Traditional red clay bricks manufactured to the highest standards. These durable bricks are perfect for walls, patios, pathways, and architectural features.',
  },
  {
    title: 'Steel I-Beams',
    category: 'Steel & Metal',
    price: 349.99,
    rating: 5,
    stock_quantity: 40,
    images: [
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794863682/stroyka/products/steel-i-beams/1-steel-pipes.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866577/stroyka/products/steel-i-beams/2-metalwork.jpg',
      'https://res.cloudinary.com/q9jdrfuj/image/upload/v1794866579/stroyka/products/steel-i-beams/3-welding.jpg',
    ],
    description:
      'Heavy-duty structural steel I-beams engineered for maximum load-bearing capacity. These professional-grade beams are essential for large construction projects.',
  },
];

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PromoCode)
    private readonly promoRepository: Repository<PromoCode>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureAdmin();
    await this.ensurePromoCode();
    await this.ensureDemoProducts();
  }

  private async ensureAdmin(): Promise<void> {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    await this.userRepository.save(
      this.userRepository.create({
        email,
        password_hash,
        role: UserRole.ADMIN,
      }),
    );
    this.logger.log(`Admin user created: ${email}`);
  }

  private async ensurePromoCode(): Promise<void> {
    const existing = await this.promoRepository.findOne({
      where: { code: 'SAVE10' },
    });
    if (existing) {
      return;
    }

    await this.promoRepository.save(
      this.promoRepository.create({
        code: 'SAVE10',
        discount_percentage: 10,
        is_active: true,
      }),
    );
    this.logger.log('Promo code seeded: SAVE10');
  }

  private async ensureDemoProducts(): Promise<void> {
    const count = await this.productRepository.count();
    if (count > 0) {
      return;
    }

    await this.productRepository.save(
      FRONTEND_CATALOG.map((product) => this.productRepository.create(product)),
    );
    this.logger.log(`Frontend catalog seeded: ${FRONTEND_CATALOG.length} products`);
  }
}
