// src/modules/organizations/organizations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';  
import { Organization } from './organization.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { UsersModule } from '../users/users.module';  
import { RolesGuard } from '../auth/guards/roles.guard'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
    UsersModule,  
  ],
  providers: [
    OrganizationsService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,  
    },
  ],
  controllers: [OrganizationsController],
  exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule {}