import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './warehouse.entity';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';
import { UsersModule } from '../users/users.module'; 

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse]), UsersModule],
  providers: [WarehousesService],
  controllers: [WarehousesController],
  exports: [TypeOrmModule, WarehousesService],
})
export class WarehousesModule {}