import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class SignWaybillDto {
  @ApiProperty({ description: 'Base64 encoded signature image' })
  @IsString()
  signature!: string;

  @ApiPropertyOptional({ description: 'Optional notes for the signature' })
  @IsOptional()
  @IsString()
  notes?: string;
}