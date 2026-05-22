import { PartialType } from '@nestjs/swagger';
import { CreateWaybillDto } from './create-waybill.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class UpdateWaybillDto extends PartialType(CreateWaybillDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  isPrinted?: boolean;

  @ApiPropertyOptional()
  @IsString()
  notes?: string;
}