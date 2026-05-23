// src/modules/warehouses/dto/create-warehouse.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsLatitude, IsLongitude, IsUUID } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Qendra Logjistike Prishtina', description: 'Name of the warehouse' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Rr. X, Prishtinë', description: 'Address of the warehouse' })
  @IsString()
  address!: string;

  @ApiProperty({ required: false, description: 'Latitude coordinate' })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ required: false, description: 'Longitude coordinate' })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiProperty({ required: false, description: 'Capacity in square meters' })
  @IsOptional()
  @IsNumber()
  capacitySqm?: number;

  @ApiProperty({ required: false, description: 'Manager name' })
  @IsOptional()
  @IsString()
  managerName?: string;

  @ApiProperty({ required: false, description: 'Manager phone number' })
  @IsOptional()
  @IsString()
  managerPhone?: string;
}