// frontend/src/pages/driver/MyShipments.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Clock, AlertCircle, Eye, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Shipment {
  id: string;
  trackingNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  priority: string;
  estimatedDelivery: string;
  is_express: boolean;
}

export const MyShipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      console.log('Fetching shipments for driver...');
      const response = await api.get('/shipments/my');
      console.log('Response data:', response.data);
      
      const data = response.data;
      const shipmentsList = data.items || data || [];
      console.log('Shipments found:', shipmentsList.length);
      
      setShipments(shipmentsList);
    } catch (error: any) {
      console.error('Error:', error);
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

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (priority === 'high') return <AlertCircle className="w-4 h-4 text-orange-500" />;
    return <Package className="w-4 h-4 text-gray-500" />;
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-700 rounded-full" />
            <h1 className="text-2xl font-extrabold text-gray-900">My Shipments</h1>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-0.5">Shipments assigned to you</p>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {shipments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No shipments assigned yet</h3>
              <p className="text-gray-500">When a dispatcher assigns you a shipment, it will appear here</p>
            </div>
          ) : (
            shipments.map((shipment) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/driver/shipments/${shipment.id}`}>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer">
                    <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getPriorityIcon(shipment.priority)}
                          <h3 className="text-lg font-bold text-gray-900 font-mono">#{shipment.trackingNumber}</h3>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(shipment.status)}`}>
                          {shipment.status?.replace('_', ' ')}
                        </span>
                        {shipment.is_express && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-200 text-orange-800">
                            Express
                          </span>
                        )}
                      </div>
                      {shipment.estimatedDelivery && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Estimated
                          </div>
                          <div className="text-sm font-bold text-gray-800">
                            {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pickup</div>
                          <div className="text-sm text-gray-800">{shipment.pickupAddress}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery</div>
                          <div className="text-sm text-gray-800">{shipment.deliveryAddress}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <div className="text-blue-700 font-medium text-sm flex items-center gap-1 hover:text-blue-900">
                        <Eye className="w-4 h-4" /> View Details
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyShipments;