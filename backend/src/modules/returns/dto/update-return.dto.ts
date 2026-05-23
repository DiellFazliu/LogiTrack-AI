import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsUUID, IsNumber, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { ReturnStatus } from '../return.entity';

export class UpdateReturnDto {
  @ApiProperty({ enum: ReturnStatus, required: false })
  @IsOptional()
  @IsEnum(ReturnStatus)
  returnStatus?: ReturnStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  pickupScheduledDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pickupScheduledTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  approvedBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  approvedAt?: Date;
}