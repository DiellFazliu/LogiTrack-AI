// src/modules/products/dto/create-product.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, Min, IsUUID } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'SKU-001', description: 'Stock Keeping Unit - unique identifier' })
  @IsString()
  sku!: string;

  @ApiProperty({ example: 'Laptop Dell XPS 15', description: 'Product name' })
  @IsString()
  name!: string;

  @ApiProperty({ required: false, description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'Electronics', description: 'Product category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, description: 'Weight in kilograms' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiProperty({ required: false, description: 'Volume in cubic meters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeM3?: number;

  @ApiProperty({ required: false, default: false, description: 'Is product hazardous?' })
  @IsOptional()
  @IsBoolean()
  hazardous?: boolean;

  @ApiProperty({ required: false, default: false, description: 'Is product fragile?' })
  @IsOptional()
  @IsBoolean()
  fragile?: boolean;

  @ApiProperty({ required: false, description: 'Product image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}