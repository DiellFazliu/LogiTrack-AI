// backend/src/modules/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { UsersModule } from '../users/users.module';
import { AiOptimization } from './ai-optimization.entity';
import { VectorStoreService } from './vector-store.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    UsersModule,
    TypeOrmModule.forFeature([AiOptimization]),
  ],
  providers: [AiService, VectorStoreService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}