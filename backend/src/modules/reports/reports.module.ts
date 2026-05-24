// src/modules/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './reports.entity';
import { Shipment } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { UsersModule } from '../users/users.module';  // ✅ Shto këtë
import { Review } from '../reviews/review.entity';
import { NotificationsModule } from '../notifications/notifications.module';  // ✅ Shto këtë
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      Shipment,
      Driver,
      Vehicle,
      Review,  
    ]),
    NotificationsModule,  // ✅ Shto këtë
    UsersModule,  // ✅ Shto këtë
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}