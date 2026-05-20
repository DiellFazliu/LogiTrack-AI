// src/modules/routes/routes.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    UsersModule,
  ],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}