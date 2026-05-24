// src/modules/organizations/organizations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './organization.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';
import { Driver } from '../drivers/driver.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Shipment } from '../shipments/shipment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, Driver, Vehicle, Shipment]),
    UsersModule,
  ],
  providers: [OrganizationsService],
  controllers: [OrganizationsController],
  exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule {}