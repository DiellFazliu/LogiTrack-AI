import api from './api';

export interface Shipment {
  id: string;
  trackingNumber: string;
  organizationId: string;
  customerId: string;
  driverId?: string;
  vehicleId?: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  weightKg?: number;
  volumeM3?: number;
  estimatedDelivery?: string;
  actualDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentDto {
  pickupAddress: string;
  deliveryAddress: string;
  weightKg?: number;
  volumeM3?: number;
  notes?: string;
}

export interface UpdateShipmentDto extends Partial<CreateShipmentDto> {
  status?: string;
  driverId?: string;
  vehicleId?: string;
}

export interface ShipmentsResponse {
  data: Shipment[];
  total: number;
  page: number;
  limit: number;
}

export const shipmentsService = {
  // Merr të gjitha dërgesat (me pagination dhe filtra)
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<ShipmentsResponse> {
    const response = await api.get('/shipments', { params });
    return response.data;
  },

  // Merr dërgesën sipas ID
  async getById(id: string): Promise<Shipment> {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },

  // Merr dërgesën sipas tracking number (publik)
  async track(trackingNumber: string): Promise<Shipment> {
    const response = await api.get(`/tracking/public/${trackingNumber}`);
    return response.data;
  },

  // Krijo dërgesë të re
  async create(data: CreateShipmentDto): Promise<Shipment> {
    const response = await api.post('/shipments', data);
    return response.data;
  },

  // Përditëso dërgesën
  async update(id: string, data: UpdateShipmentDto): Promise<Shipment> {
    const response = await api.put(`/shipments/${id}`, data);
    return response.data;
  },

  // Përditëso statusin e dërgesës
  async updateStatus(id: string, status: string): Promise<Shipment> {
    const response = await api.patch(`/shipments/${id}/status`, { status });
    return response.data;
  },

  // Fshij dërgesën
  async delete(id: string): Promise<void> {
    await api.delete(`/shipments/${id}`);
  },

  // Merr statistikat e dërgesave
  async getStatistics(): Promise<{
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
    delayed: number;
  }> {
    const response = await api.get('/shipments/statistics');
    return response.data;
  },
};