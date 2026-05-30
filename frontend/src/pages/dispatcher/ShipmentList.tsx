// frontend/src/pages/dispatcher/ShipmentList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, Edit, Truck, Search, Filter, RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Shipment {
  id: string;
  trackingNumber: string;
  customerName?: string;
  customer?: { name: string; email: string };
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  driver?: { name: string; id: string };
  driverName?: string;
  createdAt: string;
}

// StatCard component for consistent styling
const StatCard = ({ title, value, icon: Icon, bgColor }: any) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10`}>
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

export const ShipmentList: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/shipments');
      
      console.log('Response data:', response.data);
      
      let shipmentsList = [];
      if (response.data && response.data.items) {
        shipmentsList = response.data.items;
      } else if (Array.isArray(response.data)) {
        shipmentsList = response.data;
      } else {
        shipmentsList = [];
      }
      
      console.log('Shipments list:', shipmentsList);
      console.log('First shipment driver:', shipmentsList[0]?.driver);
      
      setShipments(shipmentsList);
    } catch (error: any) {
      console.error('Error fetching shipments:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-200 text-yellow-800',
      picked_up: 'bg-blue-200 text-blue-800',
      in_transit: 'bg-purple-200 text-purple-800',
      delivered: 'bg-green-200 text-green-800',
      failed: 'bg-red-200 text-red-800',
      cancelled: 'bg-gray-200 text-gray-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const getCustomerName = (shipment: Shipment) => {
    return shipment.customer?.name || shipment.customerName || 'N/A';
  };

  const getDriverName = (shipment: Shipment) => {
    if (shipment.driver?.name) {
      return shipment.driver.name;
    }
    if (shipment.driverName) {
      return shipment.driverName;
    }
    return 'Not assigned';
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
                         getCustomerName(shipment).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const total = shipments.length;
  const pending = shipments.filter(s => s.status === 'pending').length;
  const inTransit = shipments.filter(s => s.status === 'in_transit' || s.status === 'picked_up').length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;

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
                <h1 className="text-2xl font-extrabold text-gray-900">Shipments</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Manage and track all company shipments</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchShipments}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <Link to="/dispatcher/create-shipment">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition">
                  <Package className="w-4 h-4" />
                  New Shipment
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard title="TOTAL SHIPMENTS" value={total} icon={Package} bgColor="bg-blue-800" />
          <StatCard title="PENDING" value={pending} icon={Clock} bgColor="bg-yellow-800" />
          <StatCard title="IN TRANSIT" value={inTransit} icon={Truck} bgColor="bg-purple-800" />
          <StatCard title="DELIVERED" value={delivered} icon={CheckCircle} bgColor="bg-green-800" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by tracking # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No shipments found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first shipment to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tracking #</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Customer</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Pickup</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Delivery</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Driver</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {shipment.trackingNumber}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">
                        {getCustomerName(shipment)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {shipment.pickupAddress?.split(',')[0] || shipment.pickupAddress || 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {shipment.deliveryAddress?.split(',')[0] || shipment.deliveryAddress || 'N/A'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(shipment.status)}`}>
                          {shipment.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">
                        <div className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-gray-500" />
                          <span>{getDriverName(shipment)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex gap-3">
                          <Link to={`/dispatcher/shipments/${shipment.id}`}>
                            <button className="text-blue-700 hover:text-blue-900" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          {shipment.status === 'pending' && (
                            <Link to={`/dispatcher/assign-driver?shipment=${shipment.id}`}>
                              <button className="text-green-700 hover:text-green-900" title="Assign Driver">
                                <Truck className="w-4 h-4" />
                              </button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
            Showing {filteredShipments.length} of {shipments.length} shipments
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentList;

const Clock = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckCircle = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;