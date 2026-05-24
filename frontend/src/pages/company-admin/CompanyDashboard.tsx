// frontend/src/pages/company-admin/CompanyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Truck, Package, FileText, TrendingUp, MapPin, Star, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface CompanyStats {
  totalUsers: number;
  totalDrivers: number;
  totalVehicles: number;
  totalShipments: number;
  completedShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  averageDriverRating: number;
  totalReviews: number;
  monthlyShipments: number;
}

interface RecentActivity {
  id: string;
  type: 'shipment' | 'driver' | 'user' | 'review';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CompanyStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    totalShipments: 0,
    completedShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    averageDriverRating: 0,
    totalReviews: 0,
    monthlyShipments: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

// frontend/src/pages/company-admin/CompanyDashboard.tsx
// Ndrysho fetchStats dhe fetchRecentActivities

const fetchStats = async () => {
  try {
    const orgId = user?.organizationId;
    
    const [orgStats, driverRatings, shipmentsRes] = await Promise.all([
      api.get(`/organizations/${orgId}/stats`),
      api.get('/reviews/driver/average/all'),
      api.get('/shipments', { params: { organizationId: orgId, limit: 100 } })
    ]);
    
    const data = orgStats.data;
    const shipments = shipmentsRes.data?.items || shipmentsRes.data || [];
    const inTransit = shipments.filter((s: any) => s.status === 'in_transit' || s.status === 'picked_up').length;
    const monthlyShipments = shipments.filter((s: any) => {
      const date = new Date(s.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    setStats({
      totalUsers: data.totalUsers || 0,
      totalDrivers: data.totalDrivers || 0,
      totalVehicles: data.totalVehicles || 0,
      totalShipments: data.totalShipments || 0,
      completedShipments: data.completedShipments || 0,
      pendingShipments: data.pendingShipments || 0,
      inTransitShipments: inTransit,
      averageDriverRating: driverRatings.data?.average || 0,
      totalReviews: driverRatings.data?.total || 0,
      monthlyShipments: monthlyShipments,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
  } finally {
    setLoading(false);
  }
};

const fetchRecentActivities = async () => {
  try {
    const orgId = user?.organizationId;
    
    const [shipmentsRes, reviewsRes] = await Promise.all([
      api.get('/shipments', { params: { organizationId: orgId, limit: 5 } }),
      api.get('/reviews/recent', { params: { organizationId: orgId, limit: 5 } })
    ]);
    
    const shipments = shipmentsRes.data?.items || shipmentsRes.data || [];
    const reviews = reviewsRes.data || [];
    
    const activities: RecentActivity[] = [
      ...shipments.map((s: any) => ({
        id: s.id,
        type: 'shipment' as const,
        title: `Shipment ${s.trackingNumber}`,
        description: `${s.pickupAddress} → ${s.deliveryAddress}`,
        timestamp: s.createdAt,
        status: s.status,
      })),
      ...reviews.map((r: any) => ({
        id: r.id,
        type: 'review' as const,
        title: `New Review`,
        description: `Rating: ${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)} - ${r.comment?.substring(0, 50) || 'No comment'}`,
        timestamp: r.createdAt,
      }))
    ];
    
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivities(activities.slice(0, 5));
  } catch (error) {
    console.error('Error fetching activities:', error);
  }
};

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800',
      in_transit: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-3 h-3" />;
      case 'in_transit': return <Truck className="w-3 h-3" />;
      case 'picked_up': return <Truck className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const cards = [
    { title: 'Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', path: '/company/users' },
    { title: 'Drivers', value: stats.totalDrivers, icon: Truck, color: 'bg-green-500', path: '/company/drivers' },
    { title: 'Vehicles', value: stats.totalVehicles, icon: MapPin, color: 'bg-purple-500', path: '/company/vehicles' },
    { title: 'Shipments', value: stats.totalShipments, icon: Package, color: 'bg-yellow-500', path: '/company/shipments' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Company Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>
      
      {/* Stats Cards */}
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

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Shipments</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedShipments}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {stats.totalShipments > 0 ? Math.round((stats.completedShipments / stats.totalShipments) * 100) : 0}% completion rate
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Transit</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inTransitShipments}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {stats.pendingShipments} pending
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Driver Rating</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.averageDriverRating.toFixed(1)} ★</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Based on {stats.totalReviews} reviews
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Shipment Overview
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completion Rate</span>
                <span className="font-medium">
                  {stats.totalShipments > 0 ? Math.round((stats.completedShipments / stats.totalShipments) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${stats.totalShipments > 0 ? (stats.completedShipments / stats.totalShipments) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div className="flex justify-between pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completedShipments}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.inTransitShipments}</p>
                <p className="text-xs text-gray-500">In Transit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingShipments}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.monthlyShipments}</p>
                <p className="text-xs text-gray-500">This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Quick Actions
          </h2>
          <div className="space-y-2">
            <Link to="/company/users/create" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Create New User</p>
                <p className="text-xs text-gray-500">Add a new user to your organization</p>
              </div>
            </Link>
            <Link to="/company/drivers/create" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Truck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Add New Driver</p>
                <p className="text-xs text-gray-500">Register a new driver</p>
              </div>
            </Link>
            <Link to="/company/shipments/create" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Create Shipment</p>
                <p className="text-xs text-gray-500">Create a new shipment order</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Recent Activity
          </h2>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.type === 'shipment' ? (
                      <Package className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Star className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-800">{activity.title}</p>
                      {activity.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusBadge(activity.status)}`}>
                          {getStatusIcon(activity.status)}
                          {activity.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {activity.type === 'shipment' && (
                    <Link 
                      to={`/company/shipments/${activity.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;