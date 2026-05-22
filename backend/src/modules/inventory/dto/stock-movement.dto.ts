import { IsUUID, IsInt, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockMovementDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  inventoryId!: string;

  @ApiProperty({ example: 10, description: 'Quantity to add or remove' })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Restock from supplier', description: 'Reason for movement' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'IN', enum: ['IN', 'OUT', 'RESERVE', 'RELEASE'] })
  @IsOptional()
  @IsString()
  movementType?: 'IN' | 'OUT' | 'RESERVE' | 'RELEASE';
}

export class BulkStockMovementDto {
  @ApiProperty({ type: [StockMovementDto] })
  movements!: StockMovementDto[];
}