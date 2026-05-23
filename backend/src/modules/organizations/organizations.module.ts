// src/modules/organizations/organizations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './organization.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { UsersModule } from '../users/users.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
    UsersModule, 
  ],
  providers: [OrganizationsService],
  controllers: [OrganizationsController],
  exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule {}