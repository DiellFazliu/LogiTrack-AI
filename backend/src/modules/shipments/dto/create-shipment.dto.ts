// src/modules/shipments/dto/create-shipment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';

export enum ShipmentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateShipmentDto {
  @ApiProperty({ example: 'SHIP-001' })
  @IsString()
  trackingNumber!: string;

  @ApiProperty()
  @IsString()
  pickupAddress!: string;

  @ApiProperty()
  @IsString()
  deliveryAddress!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ enum: ShipmentPriority, default: ShipmentPriority.NORMAL, required: false })
  @IsOptional()
  @IsEnum(ShipmentPriority)
  priority?: ShipmentPriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  organizationId?: string;  // ✅ Shto këtë

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeM3?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isExpress?: boolean;

  // ✅ Fushat e koordinatave - BRENDA klasës
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pickupLatitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pickupLongitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryLatitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryLongitude?: number;
}