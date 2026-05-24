// backend/src/modules/shipments/dto/report-problem.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class ReportProblemDto {
  @ApiProperty({ description: 'Shipment ID' })
  @IsUUID()
  shipmentId!: string;

  @ApiProperty({ description: 'Tracking number' })
  @IsString()
  trackingNumber!: string;

  @ApiProperty({ description: 'Problem type' })
  @IsString()
  problemType!: string;

  @ApiProperty({ description: 'Problem description' })
  @IsString()
  description!: string;

  @ApiProperty({ required: false, description: 'Photo as base64' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({ required: false, description: 'Current location' })
  @IsOptional()
  @IsObject()
  location?: {
    lat: number;
    lng: number;
  };
}