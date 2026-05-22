// src/modules/routes/routes.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';

import { Route } from './routes.entity';
import { Stop } from './stop.entity';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),

    TypeOrmModule.forFeature([Route, Stop]),

    UsersModule,
  ],

  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}