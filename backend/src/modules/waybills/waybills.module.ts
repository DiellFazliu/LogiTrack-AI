import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaybillsController } from './waybills.controller';
import { WaybillsService } from './waybills.service';
import { Waybill } from './waybill.entity';
import { Shipment } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { ShipmentsModule } from '../shipments/shipments.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Waybill, Shipment, Driver, Vehicle]),
    ShipmentsModule,
    UsersModule,
  ],
  controllers: [WaybillsController],
  providers: [WaybillsService],
  exports: [WaybillsService],
})
export class WaybillsModule {}