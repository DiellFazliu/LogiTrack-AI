// frontend/src/pages/super-admin/SuperAdminShipments.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Package, RefreshCw, AlertCircle, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  organizationId: string;
  organizationName?: string;
  customerId: string;
  customerName?: string;
  driverId?: string;
  driverName?: string;
  createdAt: string;
}

// StatCard component
const StatCard = ({ title, value, icon: Icon, bgColor }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
        <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

export const SuperAdminShipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await api.get('/shipments');
      let data = response.data;
      
      if (Array.isArray(data)) {
        setShipments(data);
      } else if (data.items) {
        setShipments(data.items);
      } else if (data.data) {
        setShipments(data.data);
      } else {
        setShipments([]);
      }
    } catch (error: any) {
      console.error('Error fetching shipments:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShipments();
    toast.success('Shipments refreshed');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-200 text-yellow-800',
      picked_up: 'bg-blue-200 text-blue-800',
      in_transit: 'bg-purple-200 text-purple-800',
      delivered: 'bg-green-200 text-green-800',
      failed: 'bg-red-200 text-red-800',
      cancelled: 'bg-gray-200 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-200 text-gray-800'}`}>
        {labels[status] || status?.replace('_', ' ')}
      </span>
    );
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      shipment.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
      shipment.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: shipments.length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    issues: shipments.filter(s => s.status === 'failed' || s.status === 'cancelled').length,
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
                <h1 className="text-2xl font-extrabold text-gray-900">All Shipments</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">View and manage all shipments across organizations</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard title="TOTAL SHIPMENTS" value={stats.total} icon={Package} bgColor="bg-blue-800" />
          <StatCard title="DELIVERED" value={stats.delivered} icon={CheckCircle} bgColor="bg-green-800" />
          <StatCard title="IN TRANSIT" value={stats.inTransit} icon={Truck} bgColor="bg-yellow-800" />
          <StatCard title="ISSUES" value={stats.issues} icon={AlertCircle} bgColor="bg-red-800" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by tracking number, organization, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tracking #</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Organization</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Created</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium">No shipments found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-gray-900">{shipment.trackingNumber}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">
                        {shipment.organizationName || shipment.organizationId?.slice(0,8) || '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">
                        {shipment.customerName || shipment.customerId?.slice(0,8) || '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">{getStatusBadge(shipment.status)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          to={`/super-admin/shipments/${shipment.id}`}
                          className="text-blue-700 hover:text-blue-900 p-1 inline-flex items-center gap-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">View</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
            Showing {filteredShipments.length} of {shipments.length} shipments
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Note:</p>
              <p className="text-sm text-blue-700">
                This view shows all shipments across all organizations. Click on "View" to see detailed information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminShipments;