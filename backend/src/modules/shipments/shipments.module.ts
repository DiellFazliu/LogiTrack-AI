import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './shipment.entity';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { UsersModule } from '../users/users.module';
import { Driver } from '../drivers/driver.entity';  
import { DriversModule } from '../drivers/drivers.module';  // ✅ Shto importin

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Driver]),
    UsersModule,
    DriversModule,
  ],
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
  exports: [TypeOrmModule, ShipmentsService],
})
export class ShipmentsModule {}