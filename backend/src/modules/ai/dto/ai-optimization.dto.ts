// backend/src/modules/ai/dto/ai-optimization.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateAiOptimizationDto {
  @ApiProperty()
  @IsUUID()
  shipmentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  originalRoute?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  originalDistanceKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  originalDurationMin?: number;
}

export class UpdateAiOptimizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  optimizedRoute?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  savedDistanceKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  savedTimeMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  confidenceScore?: number;
}