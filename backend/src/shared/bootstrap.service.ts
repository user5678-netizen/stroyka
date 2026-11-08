import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { PromoCode } from './entities/promo-code.entity';
import { Product } from './entities/product.entity';

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

    const products = [
      {
        title: 'Цемент М500',
        description: 'Портландцемент для стяжки, кладки и бетона.',
        price: 450,
        rating: 4.7,
        stock_quantity: 120,
        images: [
          'https://picsum.photos/id/1015/800/600',
          'https://picsum.photos/id/1016/800/600',
          'https://picsum.photos/id/1018/800/600',
        ],
      },
      {
        title: 'Кирпич керамический',
        description: 'Рядовой кирпич для несущих стен и перегородок.',
        price: 28.5,
        rating: 4.2,
        stock_quantity: 5000,
        images: [
          'https://picsum.photos/id/1033/800/600',
          'https://picsum.photos/id/1036/800/600',
          'https://picsum.photos/id/1040/800/600',
        ],
      },
      {
        title: 'Доска обрезная',
        description: 'Хвойная доска камерной сушки для каркаса и опалубки.',
        price: 890,
        rating: 4.9,
        stock_quantity: 80,
        images: [
          'https://picsum.photos/id/106/800/600',
          'https://picsum.photos/id/129/800/600',
          'https://picsum.photos/id/164/800/600',
        ],
      },
    ];

    await this.productRepository.save(
      products.map((product) => this.productRepository.create(product)),
    );
    this.logger.log('Demo products seeded');
  }
}
