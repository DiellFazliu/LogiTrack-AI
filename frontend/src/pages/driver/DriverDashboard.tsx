// frontend/src/pages/driver/DriverDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, MapPin, CheckCircle, Clock, User, AlertCircle, FileText, Package, ArrowRight, Navigation } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
    // Navigate to route optimizer with shipment data
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
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
    { title: 'My Shipments', value: stats.total, icon: Truck, color: 'bg-blue-500', path: '/driver/shipments' },
    { title: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-yellow-500', path: '/driver/shipments?status=in_progress' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-500', path: '/driver/shipments?status=delivered' },
    { title: 'Pending Signature', value: stats.pendingSignature, icon: FileText, color: 'bg-orange-500', path: '/driver/shipments?status=pending_signature' },
  ];

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
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Driver Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Driver'}!</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card) => (
            <Link key={card.title} to={card.path}>
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{card.title}</p>
                    <p className="text-2xl font-bold mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-full`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Shipments */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                My Shipments
              </h2>
            </div>
            <div className="divide-y">
              {recentShipments.length > 0 ? (
                recentShipments.map((shipment) => (
                  <div key={shipment.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-mono text-sm font-medium">
                            {shipment.trackingNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(shipment.status)}`}>
                            {getStatusText(shipment.status)}
                          </span>
                          {shipment.waybillNumber && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              shipment.isWaybillSigned 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {shipment.isWaybillSigned ? '✓ Signed' : 'Awaiting Signature'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {shipment.deliveryAddress}
                        </p>
                        {shipment.estimatedDelivery && (
                          <p className="text-xs text-gray-500 mt-1">
                            Est. Delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {/* Start Route Button - shown only if waybill exists and not signed yet */}
                        {shipment.waybillNumber && !shipment.isWaybillSigned && shipment.status !== 'delivered' && (
                          <button
                            onClick={() => handleStartRoute(shipment)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-1 text-sm"
                          >
                            <Navigation className="w-4 h-4" />
                            Start Route
                          </button>
                        )}
                        <Link
                          key={shipment.id}
                          to={`/driver/shipments/${shipment.id}`}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No shipments assigned yet</p>
                </div>
              )}
            </div>
            {recentShipments.length > 0 && (
              <div className="p-4 border-t">
                <Link
                  to="/driver/shipments"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  View all shipments
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions & Tips */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  to="/driver/shipments"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Truck className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">View My Shipments</p>
                    <p className="text-xs text-gray-500">See all assigned deliveries</p>
                  </div>
                </Link>
                
                <Link
                  to="/driver/update-location"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <MapPin className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Update Location</p>
                    <p className="text-xs text-gray-500">Share your current position</p>
                  </div>
                </Link>
                
                <Link
                  to="/driver/profile"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <User className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Update Profile</p>
                    <p className="text-xs text-gray-500">Manage your account</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-100">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-800">
                <AlertCircle className="w-5 h-5" />
                How It Works
              </h2>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">1.</span>
                  Generate waybill for your shipment
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">2.</span>
                  Click "Start Route" to optimize your route
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">3.</span>
                  Follow the optimized route on map
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">4.</span>
                  Complete delivery and sign waybill
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">5.</span>
                  Status automatically updates to "Delivered"
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Waybill Status
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Waybills</span>
                  <span className="font-semibold">{recentShipments.filter(s => s.waybillNumber).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Signed</span>
                  <span className="font-semibold text-green-600">
                    {recentShipments.filter(s => s.isWaybillSigned).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Signature</span>
                  <span className="font-semibold text-orange-600">
                    {recentShipments.filter(s => s.waybillNumber && !s.isWaybillSigned).length}
                  </span>
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