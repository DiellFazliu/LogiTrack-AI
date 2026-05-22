import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateSettingDto {
  @ApiProperty({ example: 'company_name' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'LogiTrack AI' })
  @IsString()
  value!: string;

  @ApiPropertyOptional({ example: 'string', default: 'string' })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiPropertyOptional({ example: 'Company display name' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isEncrypted?: boolean;

  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ description: 'Organization ID (for company settings)' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}