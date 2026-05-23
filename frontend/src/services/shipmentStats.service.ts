// src/services/shipmentStats.service.ts
import api from './api';

export interface ShipmentStatistics {
  total: number;
  pending: number;
  picked_up: number;
  in_transit: number;
  delivered: number;
  failed: number;
  cancelled: number;
  onTimeRate: number;
  avgDeliveryTimeHours: number;
}

export interface ShipmentStatsByPeriod {
  date: string;
  total: number;
  delivered: number;
  inTransit: number;
}

export interface DriverStats {
  driverId: string;
  driverName: string;
  totalDeliveries: number;
  onTimeDeliveries: number;
  averageRating: number;
}

export interface MonthlyStats {
  month: string;
  total: number;
  revenue: number;
}

export const shipmentStatsService = {
  /**
   * Merr statistikat kryesore të dërgesave
   */
  async getMainStats(): Promise<ShipmentStatistics> {
    const response = await api.get('/shipments/stats/main');
    return response.data;
  },

  /**
   * Merr statistikat ditore për një periudhë
   * @param days - Numri i ditëve prapa (default: 7)
   */
  async getDailyStats(days: number = 7): Promise<ShipmentStatsByPeriod[]> {
    const response = await api.get('/shipments/stats/daily', { params: { days } });
    return response.data;
  },

  /**
   * Merr statistikat mujore për një vit
   * @param year - Viti (default: viti aktual)
   */
  async getMonthlyStats(year?: number): Promise<MonthlyStats[]> {
    const params = year ? { year } : {};
    const response = await api.get('/shipments/stats/monthly', { params });
    return response.data;
  },

  /**
   * Merr statistikat e performancës së shoferëve
   * @param limit - Numri maksimal i shoferëve (default: 10)
   */
  async getDriverPerformance(limit: number = 10): Promise<DriverStats[]> {
    const response = await api.get('/shipments/stats/drivers', { params: { limit } });
    return response.data;
  },

  /**
   * Merr statistikat e statusit të dërgesave (për grafikë by status)
   */
  async getStatusDistribution(): Promise<{ status: string; count: number }[]> {
    const response = await api.get('/shipments/stats/status');
    return response.data;
  },

  /**
   * Merr statistikat e përditësuara në kohë reale për dashboard
   */
  async getRealtimeStats(): Promise<ShipmentStatistics> {
    const response = await api.get('/shipments/stats/realtime');
    return response.data;
  },
};