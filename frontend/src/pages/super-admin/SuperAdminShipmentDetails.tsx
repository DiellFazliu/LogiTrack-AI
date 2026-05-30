// frontend/src/pages/super-admin/SuperAdminShipmentDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Calendar, User, Truck, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const SuperAdminShipmentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchShipment();
  }, [id]);

  const fetchShipment = async () => {
    try {
      const response = await api.get(`/shipments/${id}`);
      setShipment(response.data);
    } catch (error: any) {
      toast.error('Failed to load shipment details');
      navigate('/super-admin/shipments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-200 text-yellow-800', icon: Clock, label: 'Pending' },
      picked_up: { color: 'bg-blue-200 text-blue-800', icon: Truck, label: 'Picked Up' },
      in_transit: { color: 'bg-purple-200 text-purple-800', icon: Truck, label: 'In Transit' },
      delivered: { color: 'bg-green-200 text-green-800', icon: CheckCircle, label: 'Delivered' },
      failed: { color: 'bg-red-200 text-red-800', icon: AlertCircle, label: 'Failed' },
      cancelled: { color: 'bg-gray-200 text-gray-800', icon: XCircle, label: 'Cancelled' },
    };
    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!shipment) return <div className="p-8 text-center text-gray-500">Shipment not found</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/super-admin/shipments')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Shipments</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h1 className="text-2xl font-extrabold text-gray-900">Shipment Details</h1>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header with tracking & status */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">{shipment.trackingNumber}</h2>
              </div>
              {getStatusBadge(shipment.status)}
            </div>
          </div>

          {/* Details grid */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pickup */}
              <div className="border-l-4 border-green-600 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Pickup Address</p>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-900">{shipment.pickupAddress}</p>
                </div>
              </div>

              {/* Delivery */}
              <div className="border-l-4 border-red-600 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Delivery Address</p>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-900">{shipment.deliveryAddress}</p>
                </div>
              </div>

              {/* Driver */}
              <div className="border-l-4 border-blue-600 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Driver</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-gray-900">
                    {shipment.driver?.name || shipment.driverName || 'Not assigned'}
                  </p>
                </div>
              </div>

              {/* Vehicle */}
              <div className="border-l-4 border-purple-600 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Vehicle</p>
                <div className="flex items-center gap-2 mt-1">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-medium text-gray-900">
                    {shipment.vehicle?.licensePlate || shipment.vehiclePlate || 'Not assigned'}
                  </p>
                </div>
              </div>

              {/* Created At */}
              <div className="border-l-4 border-gray-600 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Created</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(shipment.createdAt || shipment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Estimated Delivery */}
              {shipment.estimatedDelivery && (
                <div className="border-l-4 border-orange-600 pl-3">
                  <p className="text-xs font-bold uppercase text-gray-500">Estimated Delivery</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(shipment.estimatedDelivery).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Weight & Volume (if present) */}
            {(shipment.weightKg || shipment.volumeM3) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 text-sm">
                  {shipment.weightKg && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700">Weight:</span>
                      <span className="text-gray-900">{shipment.weightKg} kg</span>
                    </div>
                  )}
                  {shipment.volumeM3 && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700">Volume:</span>
                      <span className="text-gray-900">{shipment.volumeM3} m³</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes (if any) */}
            {shipment.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{shipment.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};