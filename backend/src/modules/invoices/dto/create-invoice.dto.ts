import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  shipmentId?: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}