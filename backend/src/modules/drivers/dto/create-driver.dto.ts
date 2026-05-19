// src/modules/drivers/dto/create-driver.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';

export enum DriverStatus {
  AVAILABLE = 'available',
  ON_DUTY = 'on_duty',
  ON_BREAK = 'on_break',
  OFF_DUTY = 'off_duty',
  SICK = 'sick',
  VACATION = 'vacation',
}

export class CreateDriverDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ example: 'AB123456' })
  @IsString()
  licenseNumber!: string;

  @ApiProperty({ example: '+38344123456' })
  @IsPhoneNumber()
  phone!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: DriverStatus, default: DriverStatus.AVAILABLE, required: false })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;
}