import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type RedisClient = Redis;

export const RedisProvider: Provider = {
    provide: 'REDIS_CLIENT',
    useFactory: (configService: ConfigService): RedisClient => {
       return new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD') || undefined,
          db: configService.get('REDIS_DB', 0),
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
    },
    inject: [ConfigService],
};
