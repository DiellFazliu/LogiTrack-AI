// src/modules/invoices/invoices.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';
import { UsersModule } from '../users/users.module'; 

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payment]), UsersModule],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}