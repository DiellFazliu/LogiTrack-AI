// frontend/src/pages/customer/CustomerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { TruckIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Package, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';

interface ShipmentStats {
  total: number;
  delivered: number;
  inTransit: number;
  pending: number;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  estimatedDelivery?: string;
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

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ShipmentStats>({ total: 0, delivered: 0, inTransit: 0, pending: 0 });
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/shipments/customer/my', {
        params: { limit: 5, page: 1 },
      });
      const shipments: Shipment[] = response.data?.items ?? response.data?.data ?? [];
      setRecentShipments(shipments);
      setStats({
        total: response.data?.total ?? shipments.length ?? 0,
        delivered: shipments.filter((s: Shipment) => s.status === 'delivered').length,
        inTransit: shipments.filter((s: Shipment) => s.status === 'in_transit').length,
        pending: shipments.filter((s: Shipment) => s.status === 'pending').length,
      });
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to view shipments. Please contact support.');
      } else {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (trackingNumber: string) => {
    navigate(`/customer/track/${trackingNumber}`);
  };

  const statCards = [
    { title: 'Total Shipments', value: stats.total, icon: Package, bgColor: 'bg-blue-800' },
    { title: 'Delivered', value: stats.delivered, icon: CheckCircleIcon, bgColor: 'bg-green-800' },
    { title: 'In Transit', value: stats.inTransit, icon: ClockIcon, bgColor: 'bg-yellow-800' },
    { title: 'Pending', value: stats.pending, icon: ExclamationCircleIcon, bgColor: 'bg-orange-800' },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      delivered: 'bg-green-200 text-green-800',
      in_transit: 'bg-blue-200 text-blue-800',
      pending: 'bg-yellow-200 text-yellow-800',
      picked_up: 'bg-purple-200 text-purple-800',
      cancelled: 'bg-red-200 text-red-800',
      failed: 'bg-red-200 text-red-800',
    };
    return badges[status] || 'bg-gray-200 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      delivered: 'Delivered',
      in_transit: 'In Transit',
      pending: 'Pending',
      picked_up: 'Picked Up',
      cancelled: 'Cancelled',
      failed: 'Failed',
    };
    return texts[status] || status;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onClose={() => setError('')} />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Customer Dashboard</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Welcome back, {user?.name}! 👋</p>
            </div>
            <button
              onClick={() => navigate('/customer/create-shipment')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition"
            >
              <Package className="w-4 h-4" />
              New Shipment
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        {/* Recent Shipments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-base font-bold text-gray-800">Recent Shipments</h2>
            <button
              onClick={() => navigate('/customer/track')}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Track Shipment →
            </button>
          </div>

          {recentShipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No shipments found.</p>
              <button
                onClick={() => navigate('/customer/create-shipment')}
                className="inline-block mt-4 text-blue-700 hover:text-blue-800 font-semibold"
              >
                Create your first shipment →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tracking #</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">From</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">To</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 text-sm font-mono font-bold text-blue-700">
                        {shipment.trackingNumber}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {shipment.pickupAddress}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {shipment.deliveryAddress}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(shipment.status)}`}>
                          {getStatusText(shipment.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleTrackClick(shipment.trackingNumber)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                          Track
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};