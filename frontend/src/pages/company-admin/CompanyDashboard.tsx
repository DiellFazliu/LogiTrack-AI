// src/pages/company/CompanyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Truck, Package, FileText, TrendingUp, MapPin, AlertCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { shipmentsService } from '../../services/shipments.service';
import { driversService } from '../../services/drivers.service';
import { vehiclesService } from '../../services/vehicles.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Pagination } from '../../components/common/Pagination';

interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalVehicles: number;
  totalShipments: number;
  completedShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
}

export const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    totalShipments: 0,
    completedShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentShipments, setRecentShipments] = useState<any[]>([]);
  const [shipmentsPage, setShipmentsPage] = useState(1);
  const [shipmentsTotalPages, setShipmentsTotalPages] = useState(1);
  const [shipmentsTotal, setShipmentsTotal] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchShipmentsPage = async (page: number) => {
    try {
      const res = await shipmentsService.getAll({ page, limit: 10 });
      setRecentShipments(res.data || []);
      setShipmentsTotalPages(res.totalPages || 1);
      setShipmentsTotal(res.total || 0);
      return res;
    } catch (err) {
      console.error('Error fetching shipments page:', err);
      setRecentShipments([]);
      return null;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Merr statistikat nga endpoint-i i ri
      const statsData = await shipmentsService.getStats();

      // 2. Merr listën e dërgesave për tabelën e fundit
      await fetchShipmentsPage(1);

      // 3. Merr të dhënat e shoferëve dhe automjeteve
      const [driversRes, vehiclesRes] = await Promise.all([
        driversService.getAll().catch(() => ({ data: [] })),
        vehiclesService.getAll().catch(() => ({ data: [] })),
      ]);

      const drivers = driversRes.data || [];
      const vehicles = vehiclesRes.data || [];

      setStats({
        totalUsers: 0,
        totalDrivers: drivers.length,
        totalVehicles: vehicles.length,
        totalShipments: statsData.total,
        completedShipments: statsData.delivered,
        pendingShipments: statsData.pending,
        inTransitShipments: statsData.inTransit,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleShipmentsPageChange = async (page: number) => {
    setShipmentsPage(page);
    await fetchShipmentsPage(page);
  };

  const cards = [
    { title: 'Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-800', path: '/company/users', description: 'Total registered users' },
    { title: 'Drivers', value: stats.totalDrivers, icon: Truck, color: 'bg-green-800', path: '/company/drivers', description: 'Active drivers' },
    { title: 'Vehicles', value: stats.totalVehicles, icon: MapPin, color: 'bg-purple-800', path: '/company/vehicles', description: 'Fleet vehicles' },
    { title: 'Shipments', value: stats.totalShipments, icon: Package, color: 'bg-yellow-800', path: '/company/shipments', description: 'Total shipments' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Company Dashboard</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Welcome back, {user?.name}</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <motion.div key={card.title} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Link to={card.path}>
                <div className={`${card.color} rounded-xl shadow-md p-4 border border-black/10 hover:shadow-lg transition`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{card.title}</p>
                      <p className="text-2xl font-extrabold text-white mt-1">{card.value}</p>
                      <p className="text-[10px] text-white/70 mt-1">{card.description}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Shipment Overview & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-700" />
              Shipment Overview
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Shipments</span>
                <span className="font-bold text-gray-900 text-lg">{stats.totalShipments}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Completed</span>
                <span className="font-bold text-green-700">{stats.completedShipments}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">In Transit</span>
                <span className="font-bold text-blue-700">{stats.inTransitShipments}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Pending</span>
                <span className="font-bold text-yellow-700">{stats.pendingShipments}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 text-center text-xs text-gray-500">
              Detailed statistics will appear here after implementing /shipments/stats endpoint.
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link to="/company/users/create" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                  <Users className="w-4 h-4 text-blue-700" />
                </div>
                <span className="text-gray-800 font-medium">Create New User</span>
              </Link>
              <Link to="/company/drivers/create" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200">
                  <Truck className="w-4 h-4 text-green-700" />
                </div>
                <span className="text-gray-800 font-medium">Add New Driver</span>
              </Link>
              <Link to="/company/shipments/create" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200">
                  <Package className="w-4 h-4 text-yellow-700" />
                </div>
                <span className="text-gray-800 font-medium">Create New Shipment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-700" />
            Recent Shipments
          </h2>

          {recentShipments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No shipments yet.</p>
              <Link to="/company/shipments/create" className="text-blue-700 hover:underline text-sm font-medium">
                Create your first shipment →
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tracking #</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Pickup</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Delivery</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentShipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {shipment.trackingNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase ${
                            shipment.status === 'delivered' ? 'bg-green-700 text-white' :
                            shipment.status === 'in_transit' ? 'bg-blue-700 text-white' : 'bg-yellow-700 text-white'
                          }`}>
                            {shipment.status === 'delivered' ? 'Delivered' : shipment.status === 'in_transit' ? 'In Transit' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {shipment.pickupAddress?.substring(0, 35)}...
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {shipment.deliveryAddress?.substring(0, 35)}...
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Link to={`/company/shipments/${shipment.id}`} className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1">
                            <Eye className="w-4 h-4" /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={shipmentsPage}
                  totalPages={shipmentsTotalPages}
                  onPageChange={handleShipmentsPageChange}
                  totalItems={shipmentsTotal}
                  itemsPerPage={10}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;