import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsUUID, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator';
import { ReturnReason } from '../return.entity';
import { Type } from 'class-transformer';

export class CreateReturnDto {
  @ApiProperty({ description: 'Original shipment ID' })
  @IsUUID()
  originalShipmentId!: string;

  @ApiProperty({ enum: ReturnReason, description: 'Reason for return' })
  @IsEnum(ReturnReason)
  returnReason!: ReturnReason;

  @ApiProperty({ required: false, description: 'Detailed reason description' })
  @IsOptional()
  @IsString()
  reasonDescription?: string;

  @ApiProperty({ required: false, description: 'Pickup address' })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiProperty({ required: false, description: 'Pickup latitude' })
  @IsOptional()
  @IsNumber()
  pickupLatitude?: number;

  @ApiProperty({ required: false, description: 'Pickup longitude' })
  @IsOptional()
  @IsNumber()
  pickupLongitude?: number;

  @ApiProperty({ required: false, description: 'Photo URLs of damaged items' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiProperty({ required: false, description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}