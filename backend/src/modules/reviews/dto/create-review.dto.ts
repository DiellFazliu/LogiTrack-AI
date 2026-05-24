// backend/src/modules/reviews/dto/create-review.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  shipmentId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}