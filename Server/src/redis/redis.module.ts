import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisSessionService } from './services/redis-session.service';
import { RedisProvider } from './redis.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    RedisProvider,
    RedisSessionService,
  ],
  exports: ['REDIS_CLIENT', RedisSessionService],
})
export class RedisModule { }