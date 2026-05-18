// src/modules/shipments/shipments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './shipment.entity';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { UsersModule } from '../users/users.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment]),
    UsersModule, 
  ],
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
  exports: [TypeOrmModule, ShipmentsService],
})
export class ShipmentsModule {}