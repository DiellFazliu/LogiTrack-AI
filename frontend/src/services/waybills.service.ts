// frontend/src/services/waybills.service.ts
import api from './api';

export interface Waybill {
  id: string;
  shipmentId: string;
  waybillNumber: string;
  pdfUrl: string | null;
  qrCode: string | null;
  signature: string | null;
  isSigned: boolean;
  signedAt: string | null;
  generatedBy: string | null;
  isPrinted: boolean;
  printedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ShipmentInfo {
  trackingNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  driverName?: string;
  vehiclePlate?: string;
}

export interface WaybillResponse {
  id: string;
  shipmentId: string;
  shipment: ShipmentInfo;
  waybillNumber: string;
  pdfUrl: string | null;
  qrCode: string | null;
  signature: string | null;
  isSigned: boolean;
  signedAt: string | null;
  generatedBy: string | null;
  isPrinted: boolean;
  printedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export const waybillsService = {
  // Merr waybill sipas dërgesës - Kthen null nëse nuk ekziston (pa error)
  async getByShipment(shipmentId: string): Promise<WaybillResponse | null> {
    try {
      const response = await api.get(`/waybills/shipment/${shipmentId}`);
      return response.data;
    } catch (error: any) {
      // Nëse është 404 (not found) ose 403 (forbidden), kthe null pa error
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log('ℹ️ No waybill found for shipment:', shipmentId);
        return null;
      }
      // Për gabime të tjera, hidhe
      throw error;
    }
  },

  // Gjenero waybill të ri
  async generate(shipmentId: string): Promise<WaybillResponse> {
    const response = await api.post('/waybills/generate', { shipmentId });
    return response.data;
  },

  // Shkarko PDF-në e waybill
  async downloadPdf(waybillId: string): Promise<Blob> {
    const response = await api.get(`/waybills/${waybillId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Shëno waybill si të printuar
  async markAsPrinted(waybillId: string): Promise<WaybillResponse> {
    const response = await api.post(`/waybills/${waybillId}/print`);
    return response.data;
  },

  // Nënshkruaj waybill
  async sign(waybillId: string, signature: string, notes?: string): Promise<WaybillResponse> {
    const response = await api.post(`/waybills/${waybillId}/sign`, { signature, notes });
    return response.data;
  },
};