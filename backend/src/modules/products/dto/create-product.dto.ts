import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'SKU-001', description: 'Stock Keeping Unit - unique identifier' })
  @IsString()
  sku!: string;

  @ApiProperty({ example: 'Laptop Dell XPS 15', description: 'Product name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Electronics', description: 'Product category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 2.5, description: 'Weight in kilograms' })
  @IsOptional()
  @Transform(({ value }) => value !== undefined && value !== null && value !== '' ? Number(value) : null)
  @IsNumber()
  @Min(0)
  weight_kg?: number | null;

  @ApiPropertyOptional({ example: 0.05, description: 'Volume in cubic meters' })
  @IsOptional()
  @Transform(({ value }) => value !== undefined && value !== null && value !== '' ? Number(value) : null)
  @IsNumber()
  @Min(0)
  volume_m3?: number | null;

  @ApiPropertyOptional({ default: false, description: 'Is product hazardous?' })
  @IsOptional()
  @IsBoolean()
  hazardous?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Is product fragile?' })
  @IsOptional()
  @IsBoolean()
  fragile?: boolean;

  @ApiPropertyOptional({ description: 'Product image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 999.99, description: 'Product price' })
  @IsOptional()
  @Transform(({ value }) => value !== undefined && value !== null && value !== '' ? Number(value) : null)
  @IsNumber()
  @Min(0)
  price?: number | null;
}