// src/services/reports.service.ts
import api from './api';

export interface Report {
  id: string;
  organizationId: string;
  type: 'daily' | 'monthly' | 'driver_performance';
  title: string;
  data: any;
  fileUrl?: string;
  generatedAt: string;
}

export interface DailyReportData {
  date: string;
  total: number;
  delivered: number;
  inTransit: number;
  pending: number;
  cancelled: number;
  failed: number;
  deliveryRate: number;
  shipmentsByHour: number[];
}

export interface DriverPerformanceData {
  driverId: string;
  driverName: string;
  totalDeliveries: number;
  onTimeDeliveries: number;
  averageRating: number;
  totalDistance: number;
}

export const reportsService = {
  // Gjenero raport ditor
  async generateDailyReport(date: string): Promise<Report> {
    const response = await api.post('/reports/daily', { date });
    return response.data;
  },

  // Gjenero raport mujor
  async generateMonthlyReport(year: number, month: number): Promise<Report> {
    const response = await api.post('/reports/monthly', { year, month });
    return response.data;
  },

  // Gjenero raport të performancës së shoferëve
  async generateDriverPerformanceReport(startDate: string, endDate: string): Promise<Report> {
    const response = await api.post('/reports/driver-performance', { startDate, endDate });
    return response.data;
  },

  // Merr të gjitha raportet
  async getAll(params?: { type?: string; page?: number; limit?: number }): Promise<{ data: Report[]; total: number }> {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  // Merr raportin sipas ID
  async getById(id: string): Promise<Report> {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  // Shkarko raportin si PDF
  async downloadReport(id: string): Promise<Blob> {
    const response = await api.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Fshij raportin
  async delete(id: string): Promise<void> {
    await api.delete(`/reports/${id}`);
  },
};