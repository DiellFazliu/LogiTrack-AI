import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './document.entity';
import { Shipment } from '../shipments/shipment.entity';
import { ShipmentsModule } from '../shipments/shipments.module';
import { UsersModule } from '../users/users.module';  // ✅ Shto këtë

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Shipment]),
    ShipmentsModule,
    UsersModule,  
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}