// backend/src/modules/drivers/dto/update-location.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ 
    example: 42.6629, 
    description: 'Latitude coordinate (-90 to 90)' 
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ 
    example: 21.1655, 
    description: 'Longitude coordinate (-180 to 180)' 
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ 
    example: 'Pristina, Kosovo', 
    description: 'Address from reverse geocoding' 
  })
  @IsOptional()
  @IsString()
  address?: string;
}

export class LocationHistoryQueryDto {
  @ApiPropertyOptional({ 
    example: 50, 
    description: 'Number of records to return' 
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ 
    example: 0, 
    description: 'Number of records to skip' 
  })
  @IsOptional()
  @IsNumber()
  offset?: number;
}