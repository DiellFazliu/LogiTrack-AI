// shipment.types.ts - Llojet për dërgesat

export type ShipmentStatus = 
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface Shipment {
  id: string;
  trackingNumber: string;
  organizationId: string;
  customerId: string;
  driverId?: string;
  vehicleId?: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: ShipmentStatus;
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
  status?: ShipmentStatus;
  driverId?: string;
  vehicleId?: string;
}

export interface ShipmentsResponse {
  data: Shipment[];
  total: number;
  page: number;
  limit: number;
}