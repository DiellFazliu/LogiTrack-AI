import { ApiProperty } from '@nestjs/swagger';

import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max
} from 'class-validator';

export class CreateReviewDto {

  @ApiProperty()
  @IsString()
  shipmentId!: string;

  @ApiProperty()
  @IsString()
  driverId!: string;

  @ApiProperty({
    example:5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({
    required:false
  })
  @IsOptional()
  @IsString()
  comment?: string;

}