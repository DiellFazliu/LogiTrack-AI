import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, Edit, Truck, Search, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';


interface Shipment {
  id: string;
  trackingNumber: string;
  customerName?: string;
  customer?: { name: string };
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  driver?: { name: string };
  driverName?: string;
  createdAt: string;
}

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
      // Cache busting removed to avoid CORS preflight failing on custom headers.
      const response = await api.get('/shipments');
      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // ShipmentsService kthen { items, total, page, limit, totalPages }
      let shipmentsList = [];
      if (response.data && response.data.items) {
        shipmentsList = response.data.items;
      } else if (Array.isArray(response.data)) {
        shipmentsList = response.data;
      } else {
        shipmentsList = [];
      }
      
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
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCustomerName = (shipment: Shipment) => {
    return shipment.customer?.name || shipment.customerName || 'N/A';
  };

  const getDriverName = (shipment: Shipment) => {
    return shipment.driver?.name || shipment.driverName || 'Not assigned';
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
                         getCustomerName(shipment).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Shipments</h1>
            <button 
              onClick={fetchShipments}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <Link to="/dispatcher/create-shipment">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600">
                <Package className="w-4 h-4" /> New Shipment
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by tracking # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Shipments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No shipments found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first shipment to get started</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{shipment.trackingNumber}</td>
                    <td className="px-6 py-4">{getCustomerName(shipment)}</td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {shipment.pickupAddress?.split(',')?.[0] || ''}
                      {!shipment.pickupAddress?.split(',')?.[0] && shipment.pickupAddress}
                      {shipment.pickupAddress && shipment.pickupAddress.includes(',')
                        ? ''
                        : shipment.pickupAddress?.split(',')?.[1] || ''}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {shipment.deliveryAddress?.split(',')?.[0] || ''}
                      {!shipment.deliveryAddress?.split(',')?.[0] && shipment.deliveryAddress}
                      {shipment.deliveryAddress && shipment.deliveryAddress.includes(',')
                        ? ''
                        : shipment.deliveryAddress?.split(',')?.[1] || ''}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(shipment.status)}`}>
                        {shipment.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getDriverName(shipment)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link to={`/dispatcher/shipments/${shipment.id}`}>
                          <button className="text-blue-600 hover:text-blue-800">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link to={`/dispatcher/assign-driver?shipment=${shipment.id}`}>
                          <button className="text-green-600 hover:text-green-800">
                            <Truck className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentList;


