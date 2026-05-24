import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { ShipmentPriority } from '../shipment.entity';

export class CreateShipmentDto {
  @ApiPropertyOptional({ example: 'TRK123456' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty()
  @IsString()
  pickupAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pickupLatitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pickupLongitude?: number;

  @ApiProperty()
  @IsString()
  deliveryAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryLatitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryLongitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  volumeM3?: number;

  @ApiPropertyOptional({ enum: ShipmentPriority, default: ShipmentPriority.NORMAL })
  @IsOptional()
  @IsEnum(ShipmentPriority)
  priority?: ShipmentPriority;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isExpress?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  // ✅ Shto këto dy fusha për customer-in
  @ApiPropertyOptional({ description: 'Customer name for new customer' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer email for new customer' })
  @IsOptional()
  @IsString()
  customerEmail?: string;
  
}