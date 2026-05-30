// src/services/products.service.ts
import api from './api';
import type { Product, CreateProductDto, UpdateProductDto } from '../types/product.types';
export type { Product, CreateProductDto, UpdateProductDto };

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export const productsService = {
  // Merr të gjitha produktet
  async getAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<ProductsResponse> {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Merr produktin sipas ID
  async getById(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Merr produktet sipas kategorisë
  async getByCategory(category: string): Promise<Product[]> {
    const response = await api.get('/products', { params: { category } });
    return response.data;
  },

  // Krijo produkt të ri
  async create(data: CreateProductDto): Promise<Product> {
    const response = await api.post('/products', data);
    return response.data;
  },

  // Përditëso produktin
  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  // Fshij produktin
  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};