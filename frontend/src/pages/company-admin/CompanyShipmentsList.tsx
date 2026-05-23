// frontend/src/pages/company-admin/CompanyShipmentsList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, Truck, Search, Filter, Download, Calendar, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Shipment {
  id: string;
  tracking_number?: string;
  trackingNumber?: string;
  customer_name?: string;
  customerName?: string;
  customer_id?: string;
  pickup_address?: string;
  delivery_address?: string;
  deliveryAddress?: string;
  status?: string;
  priority?: string;
  is_express?: boolean;
  weight_kg?: number;
  volume_m3?: number;
  driver_name?: string;
  driver_id?: string;
  vehicle_plate?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  created_at?: string;
  createdAt?: string;
  created_by?: string;
}

interface ShipmentStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  failed: number;
}

export const CompanyShipmentsList: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
    cancelled: 0,
    failed: 0
  });

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await api.get('/shipments');
      let data = response.data;
      if (data.items) data = data.items;
      if (!Array.isArray(data)) data = [];
      
      setShipments(data);
      
      setStats({
        total: data.length,
        pending: data.filter((s: Shipment) => (s.status || '').toLowerCase() === 'pending').length,
        inTransit: data.filter((s: Shipment) => {
          const status = (s.status || '').toLowerCase();
          return status === 'in_transit' || status === 'picked_up';
        }).length,
        delivered: data.filter((s: Shipment) => (s.status || '').toLowerCase() === 'delivered').length,
        cancelled: data.filter((s: Shipment) => (s.status || '').toLowerCase() === 'cancelled').length,
        failed: data.filter((s: Shipment) => (s.status || '').toLowerCase() === 'failed').length,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const getField = (shipment: Shipment, field: string): string => {
    const camel = field.charAt(0).toLowerCase() + field.slice(1);
    const snake = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    const kebab = field.replace(/([A-Z])/g, '-$1').toLowerCase();

    return (
      (shipment as any)[camel] ??
      (shipment as any)[snake] ??
      (shipment as any)[kebab] ??
      (shipment as any)[field] ??
      ''
    );
  };

  const getFilteredShipments = () => {
    return shipments.filter(shipment => {
      const trackingNumber = getField(shipment, 'trackingNumber') || getField(shipment, 'tracking_number');
      const customerName = getField(shipment, 'customerName') || getField(shipment, 'customer_name');
      const deliveryAddress = getField(shipment, 'deliveryAddress') || getField(shipment, 'delivery_address');

      const searchLower = search.toLowerCase();

      const matchesSearch =
        trackingNumber.toLowerCase().includes(searchLower) ||
        customerName.toLowerCase().includes(searchLower) ||
        deliveryAddress.toLowerCase().includes(searchLower);

      const status = (shipment.status || '').toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

      const priority = (shipment.priority || '').toLowerCase();
      const matchesPriority = priorityFilter === 'all' || priority === priorityFilter.toLowerCase();

      const createdAt = shipment.created_at || shipment.createdAt;
      const matchesDate =
        (!dateRange.start || (createdAt && new Date(createdAt) >= new Date(dateRange.start))) &&
        (!dateRange.end || (createdAt && new Date(createdAt) <= new Date(dateRange.end)));

      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });
  };

  const exportToCSV = () => {
    const filtered = getFilteredShipments();
    if (filtered.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const csv = [
      ['Tracking #', 'Customer', 'Status', 'Priority', 'Weight (kg)', 'Volume (m³)', 'Driver', 'Created Date', 'Est. Delivery'],
      ...filtered.map(s => [
        getField(s, 'tracking_number'),
        getField(s, 'customer_name'),
        s.status || 'N/A',
        s.priority || 'normal',
        s.weight_kg?.toString() || '0',
        s.volume_m3?.toString() || '0',
        s.driver_name || 'Not assigned',
        new Date(s.created_at || s.createdAt || Date.now()).toLocaleDateString(),
        s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_transit':
      case 'picked_up':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority || 'normal'] || 'bg-gray-100 text-gray-800';
  };

  const filteredShipments = getFilteredShipments();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header (i njëjtë) */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Shipments</h1>
              <p className="text-gray-500 mt-1">Manage and track all company shipments</p>
            </div>
            <Link to="/dispatcher/create-shipment">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition">
                <Package className="w-4 h-4" /> Create Shipment
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards (i njëjtë) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.inTransit}</p>
            <p className="text-xs text-gray-500">In Transit</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            <p className="text-xs text-gray-500">Delivered</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-gray-500">Failed</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>

        {/* Filters (i njëjtë) */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tracking #, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={exportToCSV}
              className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600 transition"
            >
              <Download className="w-4 h-4" /> Export to CSV
            </button>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No shipments found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium">{getField(shipment, 'trackingNumber') || getField(shipment, 'tracking_number')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                        <p className="font-medium text-sm">{getField(shipment, 'customer_name') || getField(shipment, 'customerName') || 'N/A'}</p>
                          <p className="text-xs text-gray-500">ID: {shipment.customer_id?.slice(0, 8) || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className="text-sm truncate max-w-[180px]"
                          title={getField(shipment, 'pickupAddress') || getField(shipment, 'pickup_address') || 'N/A'}
                        >
                          {(getField(shipment, 'pickupAddress') || getField(shipment, 'pickup_address') || 'N/A')
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean)[0] ||
                            (getField(shipment, 'pickupAddress') || getField(shipment, 'pickup_address') || 'N/A').split(',').map(s => s.trim()).filter(Boolean)[1] ||
                            'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className="text-sm truncate max-w-[180px]"
                          title={getField(shipment, 'deliveryAddress') || getField(shipment, 'delivery_address') || 'N/A'}
                        >
                          {(getField(shipment, 'deliveryAddress') || getField(shipment, 'delivery_address') || 'N/A')
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean)[0] ||
                            (getField(shipment, 'deliveryAddress') || getField(shipment, 'delivery_address') || 'N/A').split(',').map(s => s.trim()).filter(Boolean)[1] ||
                            'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(shipment.status)}
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(shipment.status)}`}>
                            {(shipment.status || '').replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(shipment.priority)}`}>
                          {shipment.priority || 'normal'}
                        </span>
                        {shipment.is_express && (
                          <span className="ml-1 px-1 py-0.5 rounded text-xs bg-orange-100 text-orange-800">Express</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {shipment.driver_name ? (
                          <div className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{shipment.driver_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-yellow-600">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{new Date(shipment.created_at || shipment.createdAt || Date.now()).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{new Date(shipment.created_at || shipment.createdAt || Date.now()).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link to={`/dispatcher/shipments/${shipment.id}`}>
                            <button className="text-blue-600 hover:text-blue-800" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          {!shipment.driver_id && shipment.status === 'pending' && (
                            <Link to={`/dispatcher/assign-driver?shipment=${shipment.id}`}>
                              <button className="text-green-600 hover:text-green-800" title="Assign Driver">
                                <Truck className="w-4 h-4" />
                              </button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredShipments.length > 0 && (
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Showing {filteredShipments.length} of {shipments.length} shipments
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                  Previous
                </button>
                <button className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyShipmentsList;