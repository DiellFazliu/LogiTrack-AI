// src/modules/vehicles/dto/create-vehicle.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsDateString } from 'class-validator';

export enum VehicleType {
  TRUCK = 'truck',
  VAN = 'van',
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  TRAILER = 'trailer',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  OUT_OF_SERVICE = 'out_of_service',
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'KS-123-AB' })
  @IsString()
  licensePlate!: string;

  @ApiProperty({ enum: VehicleType, default: VehicleType.VAN })
  @IsEnum(VehicleType)
  type!: VehicleType;

  @ApiProperty({ example: 'Mercedes' })
  @IsString()
  brand!: string;

  @ApiProperty({ example: 'Sprinter' })
  @IsString()
  model!: string;

  @ApiProperty({ example: 2020 })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  year!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false, default: 1000 })
  @IsOptional()
  @IsNumber()
  capacityKg?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  capacityM3?: number;

  @ApiProperty({ required: false, default: 'diesel' })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  fuelConsumption?: number;

  @ApiProperty({ enum: VehicleStatus, default: VehicleStatus.AVAILABLE, required: false })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  lastMaintenance?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  nextMaintenance?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  mileageKm?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  registrationExpiry?: string;
}