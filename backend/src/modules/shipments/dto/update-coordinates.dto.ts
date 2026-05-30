// src/modules/shipments/dto/update-coordinates.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCoordinatesDto {
  @ApiProperty({ required: false, description: 'Pickup latitude', example: 42.6629 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  pickupLatitude?: number;

  @ApiProperty({ required: false, description: 'Pickup longitude', example: 21.1655 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  pickupLongitude?: number;

  @ApiProperty({ required: false, description: 'Delivery latitude', example: 42.6629 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  deliveryLatitude?: number;

  @ApiProperty({ required: false, description: 'Delivery longitude', example: 21.1655 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  deliveryLongitude?: number;
}