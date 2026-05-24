// src/services/drivers.service.ts
import api from './api';

export interface Driver {
  id: string;
  userId?: string;
  organizationId: string;
  licenseNumber: string;
  phone: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  status: 'available' | 'on_duty' | 'on_break' | 'off_duty' | 'sick' | 'vacation';
  rating: number;
  totalDeliveries: number;
  hireDate: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverDto {
  userId: string;
  licenseNumber: string;
  phone: string;
  address?: string;
  hireDate?: string;
}

export interface UpdateDriverDto extends Partial<Omit<CreateDriverDto, 'userId'>> {
  status?: string;
  isActive?: boolean;
}

export interface DriversResponse {
  data: Driver[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const driversService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<DriversResponse> {
    const response = await api.get('/drivers', { params });
    // Normalizojmë përgjigjen në rast se vjen si { data: [...], total, page, limit }
    if (response.data && response.data.data !== undefined) {
      return response.data;
    }
    // Nëse API kthen vetëm array, e mbështjellim
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        total: response.data.length,
        page: params?.page || 1,
        limit: params?.limit || 10,
      };
    }
    return response.data;
  },

  // Merr shoferët e disponueshëm
  async getAvailable(): Promise<Driver[]> {
    const response = await api.get('/drivers/available');
    return response.data;
  },

  // Merr shoferin sipas ID
  async getById(id: string): Promise<Driver> {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  },

  // Krijo shofer të ri (kërkon userId të një përdoruesi ekzistues me rolin driver)
  async create(data: CreateDriverDto): Promise<Driver> {
    const response = await api.post('/drivers', data);
    return response.data;
  },

  // Përditëso shoferin
  async update(id: string, data: UpdateDriverDto): Promise<Driver> {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data;
  },

  // Përditëso statusin e shoferit
  async updateStatus(id: string, status: string): Promise<Driver> {
    const response = await api.patch(`/drivers/${id}/status`, { status });
    return response.data;
  },

  // Fshij shoferin (soft-delete)
  async delete(id: string): Promise<void> {
    await api.delete(`/drivers/${id}`);
  },
};