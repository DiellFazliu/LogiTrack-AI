// dto/update-waybill.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateWaybillDto } from './create-waybill.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateWaybillDto extends PartialType(CreateWaybillDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signature?: string;
}