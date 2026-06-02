// frontend/src/pages/driver/DriverDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, MapPin, CheckCircle, Clock, User, AlertCircle, FileText, Package, ArrowRight, Navigation, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface ShipmentStats {
  total: number;
  inProgress: number;
  completed: number;
  pending: number;
  pendingSignature: number;
}

interface RecentShipment {
  id: string;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  estimatedDelivery: string;
  waybillNumber?: string;
  isWaybillSigned?: boolean;
}

// StatCard component
const StatCard = ({ title, value, icon: Icon, bgColor, path }: any) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
    <Link to={path}>
      <div className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10 hover:shadow-lg transition`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
            <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
    pendingSignature: 0,
  });
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentShipments();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/drivers/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentShipments = async () => {
    try {
      const response = await api.get('/drivers/shipments?limit=10');
      const shipments = response.data;
      setRecentShipments(shipments);
    } catch (error) {
      console.error('Error fetching recent shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRoute = (shipment: RecentShipment) => {
    navigate('/driver/route-optimizer', {
      state: {
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        pickupLat: shipment.pickupLatitude,
        pickupLng: shipment.pickupLongitude,
        deliveryLat: shipment.deliveryLatitude,
        deliveryLng: shipment.deliveryLongitude,
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
      }
    });
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

  const cards = [
    { title: 'My Shipments', value: stats.total, icon: Truck, bgColor: 'bg-blue-800', path: '/driver/shipments' },
    { title: 'In Progress', value: stats.inProgress, icon: Clock, bgColor: 'bg-yellow-800', path: '/driver/shipments?status=in_progress' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle, bgColor: 'bg-green-800', path: '/driver/shipments?status=delivered' },
    { title: 'Pending Signature', value: stats.pendingSignature, icon: FileText, bgColor: 'bg-orange-800', path: '/driver/shipments?status=pending_signature' },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-700 rounded-full" />
            <h1 className="text-2xl font-extrabold text-gray-900">Driver Dashboard</h1>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-0.5">Welcome back, {user?.name || 'Driver'}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Shipments */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-700" />
                My Shipments
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentShipments.length > 0 ? (
                recentShipments.map((shipment) => (
                  <div key={shipment.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-gray-900">
                            {shipment.trackingNumber}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(shipment.status)}`}>
                            {getStatusText(shipment.status)}
                          </span>
                          {shipment.waybillNumber && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              shipment.isWaybillSigned 
                                ? 'bg-green-200 text-green-800' 
                                : 'bg-yellow-200 text-yellow-800'
                            }`}>
                              {shipment.isWaybillSigned ? '✓ Signed' : 'Awaiting Signature'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          {shipment.deliveryAddress}
                        </p>
                        {shipment.estimatedDelivery && (
                          <p className="text-xs text-gray-500 mt-1">
                            Est. Delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {shipment.waybillNumber && !shipment.isWaybillSigned && shipment.status !== 'delivered' && (
                          <button
                            onClick={() => handleStartRoute(shipment)}
                            className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition flex items-center gap-1"
                          >
                            <Navigation className="w-4 h-4" />
                            Start Route
                          </button>
                        )}
                        <Link
                          to={`/driver/shipments/${shipment.id}`}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">No shipments assigned yet</p>
                </div>
              )}
            </div>
            {recentShipments.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
                <Link
                  to="/driver/shipments"
                  className="text-blue-700 hover:text-blue-800 text-sm font-semibold flex items-center gap-1"
                >
                  View all shipments
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-700" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link
                  to="/driver/shipments"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200">
                    <Truck className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">View My Shipments</p>
                    <p className="text-xs text-gray-600">See all assigned deliveries</p>
                  </div>
                </Link>
                <Link
                  to="/driver/update-location"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200">
                    <MapPin className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Update Location</p>
                    <p className="text-xs text-gray-600">Share your current position</p>
                  </div>
                </Link>
                <Link
                  to="/driver/profile"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200">
                    <User className="w-4 h-4 text-purple-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Update Profile</p>
                    <p className="text-xs text-gray-600">Manage your account</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h2 className="text-base font-bold text-blue-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                How It Works
              </h2>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-800">1.</span>
                  Generate waybill for your shipment
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-800">2.</span>
                  Click "Start Route" to optimize your route
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-800">3.</span>
                  Follow the optimized route on map
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-800">4.</span>
                  Complete delivery and sign waybill
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-800">5.</span>
                  Status automatically updates to "Delivered"
                </li>
              </ul>
            </div>

            {/* Waybill Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Waybill Status
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Total Waybills</span>
                  <span className="font-bold text-gray-900">{recentShipments.filter(s => s.waybillNumber).length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Signed</span>
                  <span className="font-bold text-green-700">{recentShipments.filter(s => s.isWaybillSigned).length}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Pending Signature</span>
                  <span className="font-bold text-orange-700">{recentShipments.filter(s => s.waybillNumber && !s.isWaybillSigned).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;