// backend/src/modules/drivers/drivers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { Driver } from './driver.entity';
import { DriverLocation } from './location.entity';
import { Shipment } from '../shipments/shipment.entity';
import { Waybill } from '../waybills/waybill.entity';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, DriverLocation, Shipment, Waybill]),
    UsersModule,
    AuditModule, // ✅ Shto këtë
  ],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}