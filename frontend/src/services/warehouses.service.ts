// src/services/warehouses.service.ts
import api from './api';

export interface Warehouse {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  capacitySqm?: number;
  managerName?: string;
  managerPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseDto {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  capacitySqm?: number;
  managerName?: string;
  managerPhone?: string;
}

export interface UpdateWarehouseDto extends Partial<CreateWarehouseDto> {
  isActive?: boolean;
}

export interface WarehousesResponse {
  data: Warehouse[];
  total: number;
  page: number;
  limit: number;
}

export const warehousesService = {
  // Merr të gjitha magazinat
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<WarehousesResponse> {
    const response = await api.get('/warehouses', { params });
    return response.data;
  },

  // Merr magazinën sipas ID
  async getById(id: string): Promise<Warehouse> {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  },

  // Krijo magazinë të re
  async create(data: CreateWarehouseDto): Promise<Warehouse> {
    const response = await api.post('/warehouses', data);
    return response.data;
  },

  // Përditëso magazinën
  async update(id: string, data: UpdateWarehouseDto): Promise<Warehouse> {
    const response = await api.put(`/warehouses/${id}`, data);
    return response.data;
  },

  // Fshij magazinën
  async delete(id: string): Promise<void> {
    await api.delete(`/warehouses/${id}`);
  },
};