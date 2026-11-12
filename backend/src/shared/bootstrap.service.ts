import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { PromoCode } from './entities/promo-code.entity';
import { Product } from './entities/product.entity';

/** Same catalog as last-semester frontend (`src/data/products.ts`). */
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
      'https://images.unsplash.com/photo-1673297821205-e0575bbc2ab7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1673297821205-e0575bbc2ab7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1673297821205-e0575bbc2ab7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
      'https://images.unsplash.com/photo-1704167674713-649193461719?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1704167674713-649193461719?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1704167674713-649193461719?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    description:
      'Versatile construction-grade plywood sheets suitable for a wide range of applications. These sheets are engineered for strength and dimensional stability, perfect for subfloors, roofing, walls, and general construction.',
  },
  {
    title: 'Premium Cement Bags',
    category: 'Cement & Concrete',
    price: 24.99,
    rating: 5.0,
    stock_quantity: 200,
    images: [
      'https://images.unsplash.com/photo-1718117075248-3d3c3cd65264?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1718117075248-3d3c3cd65264?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1718117075248-3d3c3cd65264?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
      'https://images.unsplash.com/photo-1764025390519-1ccc15d719a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1764025390519-1ccc15d719a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1764025390519-1ccc15d719a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    description:
      'Premium kiln-dried lumber planks perfect for all your woodworking and construction needs. These high-grade wooden planks are carefully selected for strength and appearance.',
  },
  {
    title: 'Red Clay Bricks',
    category: 'Bricks & Blocks',
    price: 0.89,
    rating: 4.0,
    stock_quantity: 5000,
    images: [
      'https://images.unsplash.com/photo-1761358270922-5a4df4ab9782?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1761358270922-5a4df4ab9782?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1761358270922-5a4df4ab9782?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    description:
      'Traditional red clay bricks manufactured to the highest standards. These durable bricks are perfect for walls, patios, pathways, and architectural features.',
  },
  {
    title: 'Steel I-Beams',
    category: 'Steel & Metal',
    price: 349.99,
    rating: 5.0,
    stock_quantity: 40,
    images: [
      'https://images.unsplash.com/photo-1707236527163-bd3478178466?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1707236527163-bd3478178466?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1707236527163-bd3478178466?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
