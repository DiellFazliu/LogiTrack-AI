/**
 * Statuset dhe ngjyrat për aplikacion
 */

// Statuset e dërgesave
export type ShipmentStatus = 
  | 'pending' 
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled';

// Ngjyrat për statuset e dërgesave
export const shipmentStatusColors: Record<ShipmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  picked_up: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

// Emrat e statuseve në shqip
export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  pending: 'Në pritje',
  picked_up: 'Marrë',
  in_transit: 'Në tranzit',
  delivered: 'Dorëzuar',
  failed: 'Dështuar',
  cancelled: 'Anuluar',
};

// Statuset e shoferëve
export type DriverStatus = 
  | 'available' 
  | 'on_duty' 
  | 'on_break' 
  | 'off_duty' 
  | 'sick' 
  | 'vacation';

export const driverStatusColors: Record<DriverStatus, string> = {
  available: 'bg-green-100 text-green-800',
  on_duty: 'bg-blue-100 text-blue-800',
  on_break: 'bg-yellow-100 text-yellow-800',
  off_duty: 'bg-gray-100 text-gray-800',
  sick: 'bg-red-100 text-red-800',
  vacation: 'bg-purple-100 text-purple-800',
};

export const driverStatusLabels: Record<DriverStatus, string> = {
  available: 'I lirë',
  on_duty: 'Në detyrë',
  on_break: 'Pushim',
  off_duty: 'Jo në detyrë',
  sick: 'I sëmurë',
  vacation: 'Pushim vjetor',
};

// Statuset e automjeteve
export type VehicleStatus = 
  | 'available' 
  | 'in_use' 
  | 'maintenance' 
  | 'repair' 
  | 'out_of_service';

export const vehicleStatusColors: Record<VehicleStatus, string> = {
  available: 'bg-green-100 text-green-800',
  in_use: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  repair: 'bg-orange-100 text-orange-800',
  out_of_service: 'bg-red-100 text-red-800',
};

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  available: 'I lirë',
  in_use: 'Në përdorim',
  maintenance: 'Mirëmbajtje',
  repair: 'Riparim',
  out_of_service: 'Jo në funksion',
};

// Statuset e faturave
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  pending: 'Në pritje',
  paid: 'Paguar',
  overdue: 'I vonuar',
  cancelled: 'Anuluar',
};

// Funksioni kryesor për të marrë ngjyrën e statusit
export const getStatusColor = (status: string, type: 'shipment' | 'driver' | 'vehicle' | 'invoice' = 'shipment'): string => {
  const colorMaps = {
    shipment: shipmentStatusColors,
    driver: driverStatusColors,
    vehicle: vehicleStatusColors,
    invoice: invoiceStatusColors,
  };
  
  const colorMap = colorMaps[type] as Record<string, string>;
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Funksioni për të marrë etiketën e statusit
export const getStatusLabel = (status: string, type: 'shipment' | 'driver' | 'vehicle' | 'invoice' = 'shipment'): string => {
  const labelMaps = {
    shipment: shipmentStatusLabels,
    driver: driverStatusLabels,
    vehicle: vehicleStatusLabels,
    invoice: invoiceStatusLabels,
  };
  
  const labelMap = labelMaps[type] as Record<string, string>;
  return labelMap[status] || status;
};