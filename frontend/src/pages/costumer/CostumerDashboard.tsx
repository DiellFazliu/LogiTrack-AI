import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { TruckIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
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

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
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
        params: {
          limit: 5,
          page: 1,
        },
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

  const statCards = [
    { title: 'Total Shipments', value: stats.total, icon: TruckIcon, color: 'blue' },
    { title: 'Delivered', value: stats.delivered, icon: CheckCircleIcon, color: 'green' },
    { title: 'In Transit', value: stats.inTransit, icon: ClockIcon, color: 'yellow' },
    { title: 'Pending', value: stats.pending, icon: ExclamationCircleIcon, color: 'orange' },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800',
      in_transit: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome, {user?.name}! 👋</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 text-${stat.color}-500`} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Shipments */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recent Shipments</h2>
          <a href="/shipments" className="text-sm text-blue-600 hover:text-blue-800">
            View All →
          </a>
        </div>
        
        {recentShipments.length === 0 ? (
          <div className="text-center py-12">
            <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No shipments found.</p>
            <a href="/create-shipment" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
              Create your first shipment →
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {shipment.trackingNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {shipment.pickupAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {shipment.deliveryAddress}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(shipment.status)}`}>
                        {getStatusText(shipment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={`/track/${shipment.trackingNumber}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Track
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};