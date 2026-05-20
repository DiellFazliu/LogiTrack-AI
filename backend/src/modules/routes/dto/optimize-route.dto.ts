import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CoordinateDto {
  @ApiProperty({ example: 13.405 })
  @IsNumber()
  @Type(() => Number)
  longitude!: number;

  @ApiProperty({ example: 52.52 })
  @IsNumber()
  @Type(() => Number)
  latitude!: number;
}

export class OptimizeRouteDto {
  @ApiProperty({ type: [CoordinateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoordinateDto)
  points!: CoordinateDto[];
}