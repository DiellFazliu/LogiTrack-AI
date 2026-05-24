// frontend/src/pages/dispatcher/DispatcherReports.tsx
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Truck, Package, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ReportStats {
  totalShipments: number;
  completedShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  failedShipments: number;
  cancelledShipments: number;
  availableDrivers: number;
  totalDrivers: number;
  availableVehicles: number;
  totalVehicles: number;
  weeklyShipments: number;
  monthlyShipments: number;
  avgDeliveryTime: number;
  onTimeDelivery: number;
}

export const DispatcherReports: React.FC = () => {
  const [stats, setStats] = useState<ReportStats>({
    totalShipments: 0,
    completedShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    failedShipments: 0,
    cancelledShipments: 0,
    availableDrivers: 0,
    totalDrivers: 0,
    availableVehicles: 0,
    totalVehicles: 0,
    weeklyShipments: 0,
    monthlyShipments: 0,
    avgDeliveryTime: 0,
    onTimeDelivery: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/drivers'),
        api.get('/vehicles')
      ]);
      
      // Sigurohu që janë array
      let shipments = Array.isArray(shipmentsRes.data?.items) 
        ? shipmentsRes.data.items 
        : Array.isArray(shipmentsRes.data) 
          ? shipmentsRes.data 
          : [];
      
      const allDrivers = Array.isArray(driversRes.data?.items) 
        ? driversRes.data.items 
        : Array.isArray(driversRes.data) 
          ? driversRes.data 
          : [];
      
      const allVehicles = Array.isArray(vehiclesRes.data?.items) 
        ? vehiclesRes.data.items 
        : Array.isArray(vehiclesRes.data) 
          ? vehiclesRes.data 
          : [];
      
      // ✅ FILTRO SHIPMENT-ET SIPAS DATE RANGE
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        
        shipments = shipments.filter((s: any) => {
          const createdDate = new Date(s.createdAt || s.created_at);
          return createdDate >= startDate && createdDate <= endDate;
        });
      }
      
      // Llogarit driver-at e disponueshëm
      const availableDriversCount = allDrivers.filter((d: any) => 
        d.status === 'available' || d.status === 'on_duty'
      ).length;
      
      // Llogarit vehicle-at e disponueshëm
      const availableVehiclesCount = allVehicles.filter((v: any) => 
        v.status === 'available'
      ).length;
      
      // Calculate date-based statistics (tani nga shipment-et e filtruara)
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      
      const weeklyShipments = shipments.filter((s: any) => 
        new Date(s.createdAt || s.created_at) >= oneWeekAgo
      ).length;
      
      const monthlyShipments = shipments.filter((s: any) => 
        new Date(s.createdAt || s.created_at) >= oneMonthAgo
      ).length;
      
      // Llogarit kohën mesatare të dorëzimit
      const deliveredShipments = shipments.filter((s: any) => s.status === 'delivered' && (s.createdAt || s.created_at) && s.actualDelivery);
      let avgDeliveryTime = 0;
      if (deliveredShipments.length > 0) {
        const totalDays = deliveredShipments.reduce((sum: number, s: any) => {
          const created = new Date(s.createdAt || s.created_at);
          const delivered = new Date(s.actualDelivery);
          const days = (delivered.getTime() - created.getTime()) / (1000 * 3600 * 24);
          return sum + days;
        }, 0);
        avgDeliveryTime = parseFloat((totalDays / deliveredShipments.length).toFixed(1));
      }
      
      // Llogarit on-time delivery rate
      const deliveredOnly = shipments.filter((s: any) => s.status === 'delivered');
      const onTimeDeliveries = shipments.filter((s: any) => {
        if (s.status !== 'delivered' || !s.estimatedDelivery || !s.actualDelivery) return false;
        return new Date(s.actualDelivery) <= new Date(s.estimatedDelivery);
      }).length;
      const onTimeDelivery = deliveredOnly.length > 0 
        ? Math.round((onTimeDeliveries / deliveredOnly.length) * 100) 
        : 0;
      
      setStats({
        totalShipments: shipments.length,
        completedShipments: shipments.filter((s: any) => s.status === 'delivered').length,
        pendingShipments: shipments.filter((s: any) => s.status === 'pending').length,
        inTransitShipments: shipments.filter((s: any) => s.status === 'in_transit' || s.status === 'picked_up').length,
        failedShipments: shipments.filter((s: any) => s.status === 'failed').length,
        cancelledShipments: shipments.filter((s: any) => s.status === 'cancelled').length,
        availableDrivers: availableDriversCount,
        totalDrivers: allDrivers.length,
        availableVehicles: availableVehiclesCount,
        totalVehicles: allVehicles.length,
        weeklyShipments: weeklyShipments,
        monthlyShipments: monthlyShipments,
        avgDeliveryTime: avgDeliveryTime,
        onTimeDelivery: onTimeDelivery,
      });
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: dateRange,
      statistics: stats,
      filteredShipmentsCount: stats.totalShipments,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispatcher_report_${dateRange.start}_to_${dateRange.end}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const getStatusPercent = (count: number) => {
    if (stats.totalShipments === 0) return 0;
    return Math.round((count / stats.totalShipments) * 100);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dispatch Reports</h1>
            <p className="text-gray-600 mt-1">View and analyze your dispatch performance</p>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
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
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Info kur nuk ka të dhëna për periudhën e zgjedhur */}
      {stats.totalShipments === 0 && dateRange.start && dateRange.end && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-700 text-sm">
            No shipments found for the selected date range ({dateRange.start} to {dateRange.end}). 
            Please adjust your filters.
          </p>
        </div>
      )}

      {/* Quick Stats Cards - i njëjti kod */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Shipments</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalShipments}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-75" />
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <span className="text-green-600">✓ {stats.completedShipments} delivered</span>
            <span className="text-yellow-600">⏳ {stats.pendingShipments} pending</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">On-Time Delivery</p>
              <p className="text-3xl font-bold text-green-600">{stats.onTimeDelivery}%</p>
            </div>
            <Clock className="w-10 h-10 text-green-500 opacity-75" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Avg delivery: {stats.avgDeliveryTime} days</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Available Drivers</p>
              <p className="text-3xl font-bold text-green-600">{stats.availableDrivers} / {stats.totalDrivers}</p>
            </div>
            <Truck className="w-10 h-10 text-green-500 opacity-75" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${stats.totalDrivers ? (stats.availableDrivers / stats.totalDrivers) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Available Vehicles</p>
              <p className="text-3xl font-bold text-orange-600">{stats.availableVehicles} / {stats.totalVehicles}</p>
            </div>
            <Truck className="w-10 h-10 text-orange-500 opacity-75" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-orange-500 h-2 rounded-full" 
              style={{ width: `${stats.totalVehicles ? (stats.availableVehicles / stats.totalVehicles) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Pjesa tjetër e kodit (Second Row Stats, Shipment Status Distribution, Performance Overview, Activity Summary) mbetet e njëjtë */}
      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">This Week</p>
              <p className="text-3xl font-bold text-purple-600">{stats.weeklyShipments}</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-500 opacity-75" />
          </div>
          <p className="text-xs text-gray-500 mt-2">vs {stats.monthlyShipments} this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Shipments</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.inTransitShipments + stats.pendingShipments}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-500 opacity-75" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{stats.inTransitShipments} in transit, {stats.pendingShipments} pending</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Delivery Time</p>
              <p className="text-3xl font-bold text-blue-600">{stats.avgDeliveryTime} days</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500 opacity-75" />
          </div>
          <p className="text-xs text-gray-500 mt-2">From order to delivery</p>
        </div>
      </div>

      {/* Shipment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Shipment Status Distribution
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Delivered
                </span>
                <span className="font-medium">{stats.completedShipments} ({getStatusPercent(stats.completedShipments)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${getStatusPercent(stats.completedShipments)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  In Transit
                </span>
                <span className="font-medium">{stats.inTransitShipments} ({getStatusPercent(stats.inTransitShipments)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${getStatusPercent(stats.inTransitShipments)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  Pending
                </span>
                <span className="font-medium">{stats.pendingShipments} ({getStatusPercent(stats.pendingShipments)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${getStatusPercent(stats.pendingShipments)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Performance Overview
          </h2>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completion Rate</span>
                <span className="font-medium text-green-600">{getStatusPercent(stats.completedShipments)}%</span>
              </div>
            </div>
            <div className="border-b pb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Driver Utilization</span>
                <span className="font-medium">{stats.totalDrivers ? Math.round((stats.availableDrivers / stats.totalDrivers) * 100) : 0}%</span>
              </div>
            </div>
            <div className="border-b pb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fleet Utilization</span>
                <span className="font-medium">{stats.totalVehicles ? Math.round((stats.availableVehicles / stats.totalVehicles) * 100) : 0}%</span>
              </div>
            </div>
            <div className="border-b pb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">On-Time Delivery</span>
                <span className="font-medium text-green-600">{stats.onTimeDelivery}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          Activity Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.weeklyShipments}</p>
            <p className="text-sm text-gray-500">Shipments this week</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.completedShipments}</p>
            <p className="text-sm text-gray-500">Completed deliveries</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{stats.pendingShipments + stats.inTransitShipments}</p>
            <p className="text-sm text-gray-500">Active shipments</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.monthlyShipments}</p>
            <p className="text-sm text-gray-500">Shipments this month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherReports;