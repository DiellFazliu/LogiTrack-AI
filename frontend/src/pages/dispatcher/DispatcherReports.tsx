// frontend/src/pages/dispatcher/DispatcherReports.tsx
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Truck, Package, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

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

// StatCard component for consistent styling
const StatCard = ({ title, value, icon: Icon, bgColor, subtext }: any) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
        <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
        {subtext && <p className="text-[10px] text-white/70 mt-1">{subtext}</p>}
      </div>
      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

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
      
      const availableDriversCount = allDrivers.filter((d: any) => 
        d.status === 'available' || d.status === 'on_duty'
      ).length;
      
      const availableVehiclesCount = allVehicles.filter((v: any) => 
        v.status === 'available'
      ).length;
      
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

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Dispatch Reports</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">View and analyze your dispatch performance</p>
            </div>
            <button
              onClick={fetchReports}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition"
            >
              Apply Filter
            </button>
            <button
              onClick={exportReport}
              className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* Info when no data */}
        {stats.totalShipments === 0 && dateRange.start && dateRange.end && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                No shipments found for the selected date range ({dateRange.start} to {dateRange.end}). 
                Please adjust your filters.
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats Cards - Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="TOTAL SHIPMENTS" value={stats.totalShipments} icon={Package} bgColor="bg-blue-800" subtext={`${stats.completedShipments} delivered, ${stats.pendingShipments} pending`} />
          <StatCard title="ON-TIME DELIVERY" value={`${stats.onTimeDelivery}%`} icon={Clock} bgColor="bg-green-800" subtext={`Avg delivery: ${stats.avgDeliveryTime} days`} />
          <StatCard title="AVAILABLE DRIVERS" value={`${stats.availableDrivers} / ${stats.totalDrivers}`} icon={Truck} bgColor="bg-indigo-800" />
          <StatCard title="AVAILABLE VEHICLES" value={`${stats.availableVehicles} / ${stats.totalVehicles}`} icon={Truck} bgColor="bg-orange-800" />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard title="THIS WEEK" value={stats.weeklyShipments} icon={Calendar} bgColor="bg-purple-800" subtext={`vs ${stats.monthlyShipments} this month`} />
          <StatCard title="ACTIVE SHIPMENTS" value={stats.inTransitShipments + stats.pendingShipments} icon={AlertCircle} bgColor="bg-yellow-800" subtext={`${stats.inTransitShipments} in transit, ${stats.pendingShipments} pending`} />
          <StatCard title="AVG DELIVERY TIME" value={`${stats.avgDeliveryTime} days`} icon={TrendingUp} bgColor="bg-teal-800" subtext="From order to delivery" />
        </div>

        {/* Shipment Status Distribution & Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Shipment Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-700" />
              Shipment Status Distribution
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 font-medium text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Delivered
                  </span>
                  <span className="font-bold text-gray-900">{stats.completedShipments} ({getStatusPercent(stats.completedShipments)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${getStatusPercent(stats.completedShipments)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 font-medium text-gray-700">
                    <Clock className="w-4 h-4 text-blue-600" />
                    In Transit
                  </span>
                  <span className="font-bold text-gray-900">{stats.inTransitShipments} ({getStatusPercent(stats.inTransitShipments)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getStatusPercent(stats.inTransitShipments)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 font-medium text-gray-700">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    Pending
                  </span>
                  <span className="font-bold text-gray-900">{stats.pendingShipments} ({getStatusPercent(stats.pendingShipments)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${getStatusPercent(stats.pendingShipments)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-700" />
              Performance Overview
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Completion Rate</span>
                <span className="font-bold text-green-700">{getStatusPercent(stats.completedShipments)}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Driver Utilization</span>
                <span className="font-bold text-gray-900">{stats.totalDrivers ? Math.round((stats.availableDrivers / stats.totalDrivers) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Fleet Utilization</span>
                <span className="font-bold text-gray-900">{stats.totalVehicles ? Math.round((stats.availableVehicles / stats.totalVehicles) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">On-Time Delivery</span>
                <span className="font-bold text-green-700">{stats.onTimeDelivery}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-700" />
            Activity Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-extrabold text-blue-700">{stats.weeklyShipments}</p>
              <p className="text-xs text-gray-600">Shipments this week</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-extrabold text-green-700">{stats.completedShipments}</p>
              <p className="text-xs text-gray-600">Completed deliveries</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-extrabold text-orange-700">{stats.pendingShipments + stats.inTransitShipments}</p>
              <p className="text-xs text-gray-600">Active shipments</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-extrabold text-purple-700">{stats.monthlyShipments}</p>
              <p className="text-xs text-gray-600">Shipments this month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};