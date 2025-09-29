import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'motorcycle_comm'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        // Connection pooling configuration
        extra: {
          connectionLimit: configService.get('DB_CONNECTION_LIMIT', 10),
          acquireConnectionTimeout: configService.get('DB_ACQUIRE_TIMEOUT', 60000),
          timeout: configService.get('DB_TIMEOUT', 60000),
          reconnect: true,
          reconnectTries: configService.get('DB_RECONNECT_TRIES', 3),
          reconnectInterval: configService.get('DB_RECONNECT_INTERVAL', 1000),
        },
        // Connection pool settings
        poolSize: configService.get('DB_POOL_SIZE', 10),
        connectTimeoutMS: configService.get('DB_CONNECT_TIMEOUT', 10000),
        acquireTimeoutMillis: configService.get('DB_ACQUIRE_TIMEOUT', 60000),
        idleTimeoutMillis: configService.get('DB_IDLE_TIMEOUT', 10000),
        reapIntervalMillis: configService.get('DB_REAP_INTERVAL', 1000),
        createTimeoutMillis: configService.get('DB_CREATE_TIMEOUT', 30000),
        destroyTimeoutMillis: configService.get('DB_DESTROY_TIMEOUT', 5000),
        // Error handling
        retryAttempts: configService.get('DB_RETRY_ATTEMPTS', 3),
        retryDelay: configService.get('DB_RETRY_DELAY', 3000),
        autoLoadEntities: true,
        keepConnectionAlive: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}