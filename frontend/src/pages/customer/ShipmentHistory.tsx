// frontend/src/pages/customer/ShipmentHistory.tsx
import React, { useState, useEffect } from 'react';
import { Eye, Package, Clock, CheckCircle, Truck, AlertCircle, MapPin, Calendar, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_transit': return <Truck className="h-4 w-4 text-blue-600" />;
      case 'picked_up': return <Truck className="h-4 w-4 text-purple-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-red-600" />;
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
      delivered: 'bg-green-200 text-green-800',
      in_transit: 'bg-blue-200 text-blue-800',
      picked_up: 'bg-purple-200 text-purple-800',
      pending: 'bg-yellow-200 text-yellow-800',
      failed: 'bg-red-200 text-red-800',
      cancelled: 'bg-gray-200 text-gray-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header with back button */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h1 className="text-2xl font-extrabold text-gray-900">Shipment History</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">View and track all your shipments</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'picked_up', 'in_transit', 'delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition ${
                    statusFilter === status
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">
              {shipments.length === 0 ? 'No shipments yet' : 'No matching shipments'}
            </h3>
            <p className="text-gray-500 text-sm">
              {shipments.length === 0 
                ? 'Create your first shipment to get started.' 
                : 'Try changing your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShipments.map((shipment) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left side */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getStatusIcon(shipment.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(shipment.status)}`}>
                        {getStatusText(shipment.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="font-mono text-sm font-bold text-blue-700 mb-2">
                      {shipment.trackingNumber}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{shipment.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{shipment.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side */}
                  <div className="flex items-center gap-3">
                    {shipment.estimatedDelivery && (
                      <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Est: {new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleTrackClick(shipment.trackingNumber)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-bold whitespace-nowrap"
                    >
                      <Eye className="h-4 w-4" />
                      Track
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500">
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