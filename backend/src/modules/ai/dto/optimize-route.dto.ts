// src/modules/ai/dto/optimize-route.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RoutePointDto {
  @ApiProperty({ example: 'Prishtinë' })
  @IsString()
  address!: string;

  @ApiProperty({ required: false, example: 42.6629 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ required: false, example: 21.1655 })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class OptimizeRouteDto {
  @ApiProperty({ type: [RoutePointDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutePointDto)
  points!: RoutePointDto[];

  @ApiProperty({ required: false, default: 'fastest' })
  @IsString()
  @IsOptional()
  optimization?: 'fastest' | 'shortest' | 'eco';
}