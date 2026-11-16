import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';

import { LoggerMiddleware } from './shared/middlewares/logger.middleware';
import { HealthModule } from './health/health.module';
import { BootstrapModule } from './shared/bootstrap.module';
import { postgresConnectionFromEnv } from './shared/config/postgres.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().optional().allow(''),
        DB_HOST: Joi.string().when('DATABASE_URL', {
          is: Joi.string().min(1),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().when('DATABASE_URL', {
          is: Joi.string().min(1),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_PASSWORD: Joi.string().when('DATABASE_URL', {
          is: Joi.string().min(1),
          then: Joi.optional().allow(''),
          otherwise: Joi.required(),
        }),
        DB_NAME: Joi.string().when('DATABASE_URL', {
          is: Joi.string().min(1),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_SSL: Joi.string().valid('true', 'false').optional(),
        REDIS_URL: Joi.string().optional().allow(''),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').optional(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('86400s'),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
        ADMIN_EMAIL: Joi.string().email().required(),
        ADMIN_PASSWORD: Joi.string().min(8).required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...postgresConnectionFromEnv(),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    AuthModule,
    ProductsModule,
    CartModule,
    HealthModule,
    BootstrapModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}