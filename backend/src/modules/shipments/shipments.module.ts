import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './shipment.entity';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { UsersModule } from '../users/users.module';
import { Driver } from '../drivers/driver.entity';  
import { DriversModule } from '../drivers/drivers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Driver]),
    UsersModule,
    DriversModule,
    NotificationsModule,
    AuditModule,
  ],
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
  exports: [TypeOrmModule, ShipmentsService],
})
export class ShipmentsModule {}