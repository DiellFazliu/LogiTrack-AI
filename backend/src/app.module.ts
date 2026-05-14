
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import * as redisStore from 'cache-manager-ioredis';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

import { ShipmentsModule } from './modules/shipments/shipments.module';

import { JwtModule } from '@nestjs/jwt';
import { AuthMiddleware } from './common/middleware/auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({  // Shto këtë module
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: 60,
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ShipmentsModule
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // LoggerMiddleware për të gjitha rrugët
    consumer.apply(LoggerMiddleware).forRoutes('*');
    
    // AuthMiddleware - zbatohet për të gjitha rrugët PËRVEÇ atyre publike
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'api-docs', method: RequestMethod.GET },
        { path: 'api-docs-json', method: RequestMethod.GET },
        { path: 'shipments/track/:trackingNumber', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}