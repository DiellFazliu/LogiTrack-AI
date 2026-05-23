import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './driver.entity';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Driver]), UsersModule],
  providers: [DriversService],
  controllers: [DriversController],
  exports: [TypeOrmModule, DriversService],
})
export class DriversModule {}