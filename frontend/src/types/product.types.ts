// src/types/product.types.ts
export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  weightKg?: number;
  volumeM3?: number;
  hazardous: boolean;
  fragile: boolean;
  imageUrl?: string;
  price?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  weightKg?: number;
  volumeM3?: number;
  hazardous?: boolean;
  fragile?: boolean;
  imageUrl?: string;
  price?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  isActive?: boolean;
}