import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const CATALOG_PREFIX = 'products:';
const DEFAULT_TTL_SECONDS = 120;

@Injectable()
export class CatalogCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CatalogCacheService.name);
  private readonly redis: Redis;
  private connectionWarningShown = false;

  constructor(configService: ConfigService) {
    const password = configService.get<string>('REDIS_PASSWORD');
    const redisUrl = configService.get<string>('REDIS_URL');
    const options = {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableOfflineQueue: false,
      lazyConnect: false,
      retryStrategy: (times: number) =>
        times > 5 ? null : Math.min(times * 200, 1000),
    };
    this.redis = redisUrl
      ? new Redis(redisUrl, options)
      : new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: Number(configService.get('REDIS_PORT', 6379)),
          password: password ? password : undefined,
          ...options,
        });

    this.redis.on('error', (error) => {
      if (this.connectionWarningShown) {
        return;
      }
      this.connectionWarningShown = true;
      this.logger.warn(
        `Redis недоступен, кэш каталога отключён: ${error.message}`,
      );
    });
  }

  buildKey(params: Record<string, string | number | undefined>): string {
    const search = new URLSearchParams();
    for (const key of Object.keys(params).sort()) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, String(value));
      }
    }
    return `${CATALOG_PREFIX}${search.toString()}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.debug(`Cache read failed: ${(error as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.debug(`Cache write failed: ${(error as Error).message}`);
    }
  }

  async invalidateCatalog(): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          `${CATALOG_PREFIX}*`,
          'COUNT',
          100,
        );
        cursor = next;
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.debug(`Cache invalidation failed: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }
}
