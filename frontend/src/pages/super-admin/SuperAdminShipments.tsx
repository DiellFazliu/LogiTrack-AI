import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Package, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      shipment.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
      shipment.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">All Shipments</h1>
              <p className="text-gray-500 mt-1">View and manage all shipments across organizations</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by tracking number, organization, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{shipments.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{shipments.filter(s => s.status === 'delivered').length}</p>
            <p className="text-xs text-gray-500">Delivered</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{shipments.filter(s => s.status === 'in_transit').length}</p>
            <p className="text-xs text-gray-500">In Transit</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{shipments.filter(s => s.status === 'failed' || s.status === 'cancelled').length}</p>
            <p className="text-xs text-gray-500">Issues</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No shipments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">{shipment.trackingNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {shipment.organizationName || shipment.organizationId?.slice(0,8) || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {shipment.customerName || shipment.customerId?.slice(0,8) || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(shipment.status)}`}>
                          {shipment.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/super-admin/shipments/${shipment.id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-500">
            Showing {filteredShipments.length} of {shipments.length} shipments
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Note:</p>
              <p className="text-sm text-blue-700">
                This view shows all shipments across all organizations. Click on any row to view detailed information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminShipments;