// frontend/src/pages/customer/ShipmentHistory.tsx
import React, { useState, useEffect } from 'react';
import { Eye, Package, Clock, CheckCircle, Truck, AlertCircle, MapPin, Calendar, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
  weightKg?: number;
  volumeM3?: number;
  notes?: string;
}

export const ShipmentHistory: React.FC = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/shipments/customer/my', {
        params: { limit: 100, page: 1 }
      });
      
      console.log('Shipments response:', response.data);
      
      // Përshtat strukturën e response
      let shipmentsData = [];
      if (response.data?.items) {
        shipmentsData = response.data.items;
      } else if (response.data?.data) {
        shipmentsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        shipmentsData = response.data;
      } else {
        shipmentsData = [];
      }
      
      setShipments(shipmentsData);
      
    } catch (err: any) {
      console.error('Failed to fetch shipments:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to view shipments.');
      } else {
        setError(err.response?.data?.message || 'Failed to load shipment history');
      }
      toast.error('Failed to load shipment history');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (trackingNumber: string) => {
    navigate(`/customer/track/${trackingNumber}`);
  };

  const getFilteredShipments = () => {
    let filtered = [...shipments];
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    return filtered;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_transit':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'picked_up':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Pending',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return texts[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: 'bg-green-100 text-green-700',
      in_transit: 'bg-blue-100 text-blue-700',
      picked_up: 'bg-purple-100 text-purple-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return shipments.length;
    return shipments.filter(s => s.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <ErrorAlert message={error} onClose={() => setError('')} />
      </div>
    );
  }

  const filteredShipments = getFilteredShipments();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Shipment History</h1>
          <p className="text-gray-500 mt-1">View and track all your shipments</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by tracking number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'pending', 'picked_up', 'in_transit', 'delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : getStatusText(status)} ({getStatusCount(status)})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Shipments List */}
        {filteredShipments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              {shipments.length === 0 ? 'No shipments yet' : 'No matching shipments'}
            </h3>
            <p className="text-gray-400 text-sm">
              {shipments.length === 0 
                ? 'Create your first shipment to get started.' 
                : 'Try changing your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShipments.map((shipment) => (
              <div
                key={shipment.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left side - Tracking info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(shipment.status)}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(shipment.status)}`}>
                        {getStatusText(shipment.status)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="font-mono text-sm font-medium text-blue-600 mb-2">
                      {shipment.trackingNumber}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 truncate">{shipment.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 truncate">{shipment.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Action button */}
                  <div className="flex items-center gap-3">
                    {shipment.estimatedDelivery && (
                      <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>Est: {new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleTrackClick(shipment.trackingNumber)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium whitespace-nowrap"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Track
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-xs text-gray-400">
                Showing {filteredShipments.length} of {shipments.length} shipments
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentHistory;