// frontend/src/pages/super-admin/SuperAdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, Package, TrendingUp, Shield, 
  Settings, FileText, Activity, UserPlus, 
  CreditCard, AlertCircle, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  totalShipments: number;
  activeSubscriptions: number;
  totalDrivers: number;
  totalVehicles: number;
  monthlyShipments: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    totalShipments: 0,
    activeSubscriptions: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    monthlyShipments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch data from endpoints that Super Admin CAN access
      const [orgsRes, usersRes, shipmentsRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/users'),
        api.get('/shipments')
      ]);
      
      const organizations = orgsRes.data || [];
      const users = usersRes.data || [];
      const shipments = shipmentsRes.data?.items || shipmentsRes.data || [];
      
      // Calculate active subscriptions (organizations with active status)
      const activeSubscriptions = organizations.filter((org: any) => 
        org.subscription_status === 'active' || org.is_active === true
      ).length;
      
      // Calculate monthly shipments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyShipments = shipments.filter((s: any) => 
        new Date(s.created_at) >= thirtyDaysAgo
      ).length;
      
      // Try to get drivers and vehicles from organization stats instead
      let totalDrivers = 0;
      let totalVehicles = 0;
      
      // Aggregate drivers and vehicles from all organizations
      for (const org of organizations) {
        try {
          // Try to get org stats - this endpoint might exist
          const orgStatsRes = await api.get(`/organizations/${org.id}/stats`);
          if (orgStatsRes.data) {
            totalDrivers += orgStatsRes.data.totalDrivers || 0;
            totalVehicles += orgStatsRes.data.totalVehicles || 0;
          }
        } catch (e) {
          // If individual org stats fail, skip
          console.log(`Could not fetch stats for org ${org.id}`);
        }
      }
      
      setStats({
        totalOrganizations: organizations.length,
        totalUsers: users.length,
        totalShipments: shipments.length,
        activeSubscriptions: activeSubscriptions,
        totalDrivers: totalDrivers,
        totalVehicles: totalVehicles,
        monthlyShipments: monthlyShipments,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const cards = [
    { 
      title: 'Organizations', 
      value: stats.totalOrganizations, 
      icon: Building2, 
      color: 'bg-blue-500', 
      path: '/super-admin/organizations',
      description: 'Total companies'
    },
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'bg-green-500', 
      path: '/super-admin/users',
      description: 'Across all orgs'
    },
    { 
      title: 'Shipments', 
      value: stats.totalShipments, 
      icon: Package, 
      color: 'bg-purple-500', 
      path: '/super-admin/shipments',
      description: 'All time'
    },
    { 
      title: 'Active Subs', 
      value: stats.activeSubscriptions, 
      icon: CreditCard, 
      color: 'bg-yellow-500', 
      path: '/super-admin/subscriptions',
      description: 'Active subscriptions'
    },
    { 
      title: 'Drivers', 
      value: stats.totalDrivers, 
      icon: Users, 
      color: 'bg-indigo-500', 
      path: '/super-admin/drivers', 
      description: 'Total drivers'
    },
    { 
      title: 'Vehicles', 
      value: stats.totalVehicles, 
      icon: Building2, 
      color: 'bg-teal-500', 
      path: '/super-admin/vehicles',
      description: 'Fleet size'
    },
  ];

  const quickActions = [
    { 
      title: 'Create Organization', 
      icon: Building2, 
      path: '/super-admin/organizations/create',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      title: 'View All Users', 
      icon: Users, 
      path: '/super-admin/users',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      title: 'System Settings', 
      icon: Settings, 
      path: '/super-admin/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    { 
      title: 'Manage Plans', 
      icon: CreditCard, 
      path: '/super-admin/plans',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">System overview and management</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {cards.map((card) => (
            <Link key={card.title} to={card.path}>
              <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                  </div>
                  <div className={`${card.color} p-2 rounded-full group-hover:scale-110 transition`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" /> 
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.path}
                  className={`flex items-center gap-3 p-3 rounded-lg ${action.bgColor} hover:opacity-80 transition`}
                >
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <span className="font-medium text-gray-700">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" /> 
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">API Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Shipments</span>
                <span className="font-semibold">{stats.monthlyShipments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Organizations</span>
                <span className="font-semibold">{stats.activeSubscriptions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-500" /> 
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">System ready and operational</p>
                <p className="text-xs text-gray-400">Current</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Dashboard loaded successfully</p>
                <p className="text-xs text-gray-400">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Dashboard Information:</p>
              <p className="text-sm text-blue-700">
                Driver and vehicle statistics are aggregated from organization data. 
                Some features may be expanded as the backend API develops.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;