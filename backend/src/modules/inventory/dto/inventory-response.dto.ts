import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WarehouseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  address!: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  price?: number;
}

export class InventoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiPropertyOptional({ type: WarehouseResponseDto })
  warehouse?: WarehouseResponseDto;  

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional({ type: ProductResponseDto })
  product?: ProductResponseDto;  

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  reservedQuantity!: number;

  @ApiProperty()
  availableQuantity!: number;

  @ApiProperty()
  minStock!: number;

  @ApiPropertyOptional()
  maxStock!: number | null;

  @ApiProperty()
  reorderPoint!: number;

  @ApiPropertyOptional()
  locationInWarehouse!: string | null;

  @ApiPropertyOptional()
  batchNumber!: string | null;

  @ApiPropertyOptional()
  expiryDate!: string | null;

  @ApiPropertyOptional()
  notes!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}