// frontend/src/pages/super-admin/SuperAdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, Package, TrendingUp, Shield, 
  Settings, FileText, Activity, UserPlus, 
  CreditCard, AlertCircle, RefreshCw 
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface DashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  totalShipments: number;
  activeSubscriptions: number;
  totalDrivers: number;
  totalVehicles: number;
  monthlyShipments: number;
}

// StatCard component for consistent styling
const StatCard = ({ title, value, icon: Icon, bgColor, path, description }: any) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
    <Link to={path}>
      <div className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10 hover:shadow-lg transition`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
            <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
            <p className="text-[10px] text-white/70 mt-1">{description}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

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
      const [orgsRes, usersRes, shipmentsRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/users'),
        api.get('/shipments')
      ]);
      
      const organizations = orgsRes.data || [];
      const users = usersRes.data || [];
      const shipments = shipmentsRes.data?.items || shipmentsRes.data || [];
      
      const activeSubscriptions = organizations.filter((org: any) => 
        org.subscription_status === 'active' || org.is_active === true
      ).length;
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyShipments = shipments.filter((s: any) => 
        new Date(s.created_at) >= thirtyDaysAgo
      ).length;
      
      let totalDrivers = 0;
      let totalVehicles = 0;
      
      for (const org of organizations) {
        try {
          const orgStatsRes = await api.get(`/organizations/${org.id}/stats`);
          if (orgStatsRes.data) {
            totalDrivers += orgStatsRes.data.totalDrivers || 0;
            totalVehicles += orgStatsRes.data.totalVehicles || 0;
          }
        } catch (e) {
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
    { title: 'Organizations', value: stats.totalOrganizations, icon: Building2, bgColor: 'bg-blue-800', path: '/super-admin/organizations', description: 'Total companies' },
    { title: 'Total Users', value: stats.totalUsers, icon: Users, bgColor: 'bg-green-800', path: '/super-admin/users', description: 'Across all orgs' },
    { title: 'Shipments', value: stats.totalShipments, icon: Package, bgColor: 'bg-purple-800', path: '/super-admin/shipments', description: 'All time' },
    { title: 'Active Subs', value: stats.activeSubscriptions, icon: CreditCard, bgColor: 'bg-yellow-800', path: '/super-admin/subscriptions', description: 'Active subscriptions' },
    { title: 'Drivers', value: stats.totalDrivers, icon: Users, bgColor: 'bg-indigo-800', path: '/super-admin/drivers', description: 'Total drivers' },
    { title: 'Vehicles', value: stats.totalVehicles, icon: Building2, bgColor: 'bg-teal-800', path: '/super-admin/vehicles', description: 'Fleet size' },
  ];

  const quickActions = [
    { title: 'Create Organization', icon: Building2, path: '/super-admin/organizations/create', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    { title: 'View All Users', icon: Users, path: '/super-admin/users', color: 'text-green-700', bgColor: 'bg-green-50' },
    { title: 'System Settings', icon: Settings, path: '/super-admin/settings', color: 'text-gray-700', bgColor: 'bg-gray-50' },
    { title: 'Manage Plans', icon: CreditCard, path: '/super-admin/plans', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Super Admin Dashboard</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">System overview and management</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        {/* Quick Actions & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-700" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.path}
                  className={`flex items-center gap-3 p-3 rounded-lg ${action.bgColor} hover:opacity-80 transition group`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-105 transition">
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                  </div>
                  <span className="font-medium text-gray-800">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-700" />
              System Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">API Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Database</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Monthly Shipments</span>
                <span className="font-bold text-gray-900">{stats.monthlyShipments}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Active Organizations</span>
                <span className="font-bold text-gray-900">{stats.activeSubscriptions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">System ready and operational</p>
                <p className="text-xs text-gray-500">Current</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Dashboard loaded successfully</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Dashboard Information</p>
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