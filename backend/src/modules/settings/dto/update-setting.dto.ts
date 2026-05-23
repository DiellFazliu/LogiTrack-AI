import { PartialType } from '@nestjs/swagger';
import { CreateSettingDto } from './create-setting.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateSettingDto extends PartialType(CreateSettingDto) {
  @ApiPropertyOptional({ example: 'New Company Name' })
  @IsString()
  value?: string;
}