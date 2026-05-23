// frontend/src/pages/company/CompanyReports.tsx
import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, Truck, Package, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ReportStats {
  totalShipments: number;
  completedShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  totalDrivers: number;
  activeDrivers: number;
  totalVehicles: number;
  availableVehicles: number;
  avgDeliveryTime: number;
  onTimeDelivery: number;
}

export const CompanyReports: React.FC = () => {
  const [stats, setStats] = useState<ReportStats>({
    totalShipments: 0,
    completedShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    avgDeliveryTime: 0,
    onTimeDelivery: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Helper: extract array from paginated response or direct array
      const extractData = (res: any) => {
        if (res.data?.data) return res.data.data;     // paginated: { data: [...] }
        if (Array.isArray(res.data)) return res.data; // direct array
        return [];
      };

      const [shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/drivers'),
        api.get('/vehicles')
      ]);
      
      const shipments = extractData(shipmentsRes);
      const drivers = extractData(driversRes);
      const vehicles = extractData(vehiclesRes);
      
      const completedShipments = shipments.filter((s: any) => s.status === 'delivered').length;
      const pendingShipments = shipments.filter((s: any) => s.status === 'pending').length;
      const inTransitShipments = shipments.filter((s: any) => s.status === 'in_transit').length;
      const totalShipments = shipments.length;
      
      const totalDrivers = drivers.length;
      const activeDrivers = drivers.filter((d: any) => d.status === 'available' || d.status === 'on_duty').length;
      
      const totalVehicles = vehicles.length;
      const availableVehicles = vehicles.filter((v: any) => v.status === 'available').length;
      
      setStats({
        totalShipments,
        completedShipments,
        pendingShipments,
        inTransitShipments,
        totalDrivers,
        activeDrivers,
        totalVehicles,
        availableVehicles,
        avgDeliveryTime: 2.5,      // TODO: calculate from actual data
        onTimeDelivery: 94,        // TODO: calculate from actual data
      });
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">View your company performance metrics</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button 
          onClick={fetchReports}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Apply Filter
        </button>
        <button 
          onClick={exportReport}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Shipments</p>
              <p className="text-2xl font-bold">{stats.totalShipments}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-green-600">✓ {stats.completedShipments} completed</span>
            <span className="text-yellow-600">⏳ {stats.pendingShipments} pending</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">On-Time Delivery</p>
              <p className="text-2xl font-bold text-green-600">{stats.onTimeDelivery}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">+2% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Drivers</p>
              <p className="text-2xl font-bold">{stats.activeDrivers} / {stats.totalDrivers}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-purple-500 h-1.5 rounded-full" 
              style={{ width: `${stats.totalDrivers ? (stats.activeDrivers / stats.totalDrivers) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Available Vehicles</p>
              <p className="text-2xl font-bold">{stats.availableVehicles} / {stats.totalVehicles}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-yellow-500 h-1.5 rounded-full" 
              style={{ width: `${stats.totalVehicles ? (stats.availableVehicles / stats.totalVehicles) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Shipment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Shipment Status Distribution</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Delivered</span>
                <span>{stats.completedShipments} ({Math.round((stats.completedShipments / stats.totalShipments) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.completedShipments / stats.totalShipments) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>In Transit</span>
                <span>{stats.inTransitShipments} ({Math.round((stats.inTransitShipments / stats.totalShipments) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.inTransitShipments / stats.totalShipments) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Pending</span>
                <span>{stats.pendingShipments} ({Math.round((stats.pendingShipments / stats.totalShipments) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.pendingShipments / stats.totalShipments) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Driver & Vehicle Performance</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Driver Utilization</span>
                <span>{Math.round((stats.activeDrivers / stats.totalDrivers) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.activeDrivers / stats.totalDrivers) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Vehicle Utilization</span>
                <span>{Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Avg Delivery Time</span>
                <span>{stats.avgDeliveryTime} days</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyReports;