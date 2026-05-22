// src/services/vehicles.service.ts
import api from './api';

export interface Vehicle {
  id: string;
  organizationId: string;
  licensePlate: string;
  type: 'truck' | 'van' | 'motorcycle' | 'car' | 'trailer';
  brand: string;
  model: string;
  year: number;
  color?: string;
  capacityKg: number;
  capacityM3: number;
  fuelType: string;
  fuelConsumption?: number;
  status: 'available' | 'in_use' | 'maintenance' | 'repair' | 'out_of_service';
  lastMaintenance?: string;
  nextMaintenance?: string;
  mileageKm: number;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleDto {
  licensePlate: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  capacityKg?: number;
  capacityM3?: number;
  fuelType?: string;
}

export interface UpdateVehicleDto extends Partial<CreateVehicleDto> {
  status?: string;
  mileageKm?: number;
  isActive?: boolean;
}

export interface VehiclesResponse {
  data: Vehicle[];
  total: number;
  page: number;
  limit: number;
}

export const vehiclesService = {
  // Merr të gjitha automjetet
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<VehiclesResponse> {
    const response = await api.get('/vehicles', { params });
    return response.data;
  },

  // Merr automjetet e disponueshme
  async getAvailable(): Promise<Vehicle[]> {
    const response = await api.get('/vehicles/available');
    return response.data;
  },

  // Merr automjetin sipas ID
  async getById(id: string): Promise<Vehicle> {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  // Krijo automjet të ri
  async create(data: CreateVehicleDto): Promise<Vehicle> {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  // Përditëso automjetin
  async update(id: string, data: UpdateVehicleDto): Promise<Vehicle> {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  // Përditëso statusin e automjetit
  async updateStatus(id: string, status: string): Promise<Vehicle> {
    const response = await api.patch(`/vehicles/${id}/status`, { status });
    return response.data;
  },

  // Fshij automjetin
  async delete(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },
};