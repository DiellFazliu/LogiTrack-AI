// frontend/src/pages/super-admin/SubscriptionsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, CheckCircle, XCircle, Clock, AlertTriangle, 
  CreditCard, Edit, RefreshCw, Search, Filter, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Organization {
  id: string;
  name: string;
  email: string;
  plan_type?: string;
  subscription_status?: string;
  subscription_ends_at: string | null;
  max_users: number;
  max_shipments_per_month: number;
  is_active: boolean;
  created_at: string;
}

// StatCard component
const StatCard = ({ title, value, icon: Icon, bgColor, trend }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
        <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
        {trend && <p className="text-[10px] text-white/70 mt-1">{trend}</p>}
      </div>
      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

export const SubscriptionsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizations');
      setOrganizations(response.data || []);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrganizations();
    toast.success('Subscriptions refreshed');
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-200 text-green-800', icon: CheckCircle, label: 'Active' };
      case 'inactive':
        return { color: 'bg-gray-200 text-gray-800', icon: XCircle, label: 'Inactive' };
      case 'trial':
        return { color: 'bg-blue-200 text-blue-800', icon: Clock, label: 'Trial' };
      case 'expired':
        return { color: 'bg-red-200 text-red-800', icon: AlertTriangle, label: 'Expired' };
      default:
        return { color: 'bg-gray-200 text-gray-800', icon: XCircle, label: status || 'Unknown' };
    }
  };

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'free':
        return 'bg-gray-200 text-gray-800';
      case 'basic':
        return 'bg-blue-200 text-blue-800';
      case 'pro':
        return 'bg-purple-200 text-purple-800';
      case 'enterprise':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          org.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrgs = organizations.length;
  const activeSubscriptions = organizations.filter(o => o.subscription_status === 'active').length;
  const trialSubscriptions = organizations.filter(o => o.subscription_status === 'trial').length;
  const expiredSubscriptions = organizations.filter(o => o.subscription_status === 'expired').length;

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
                <h1 className="text-2xl font-extrabold text-gray-900">Subscriptions Management</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Manage organization plans and billing</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="TOTAL ORGANIZATIONS" value={totalOrgs} icon={Building2} bgColor="bg-blue-800" />
          <StatCard title="ACTIVE SUBSCRIPTIONS" value={activeSubscriptions} icon={TrendingUp} bgColor="bg-green-800" />
          <StatCard title="TRIAL PERIODS" value={trialSubscriptions} icon={Clock} bgColor="bg-yellow-800" />
          <StatCard title="EXPIRED" value={expiredSubscriptions} icon={AlertTriangle} bgColor="bg-red-800" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by organization name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="sm:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Organization</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Expires</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Limits</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.map((org) => {
                  const StatusBadge = getStatusBadge(org.subscription_status);
                  const planName = org.plan_type ? org.plan_type.charAt(0).toUpperCase() + org.plan_type.slice(1) : 'Free';
                  return (
                    <tr key={org.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-700" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-900">{org.name || 'N/A'}</div>
                            <div className="text-xs text-gray-600">{org.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getPlanBadge(org.plan_type)}`}>
                          {planName}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${StatusBadge.color}`}>
                          <StatusBadge.icon className="w-3 h-3" />
                          {StatusBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {org.subscription_ends_at ? new Date(org.subscription_ends_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>👥 {org.max_users ?? 0} users</span>
                          <span>•</span>
                          <span>📦 {org.max_shipments_per_month ?? 0} shipments/mo</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/super-admin/organizations/${org.id}/edit`}
                          className="text-indigo-700 hover:text-indigo-900 mr-3 inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <Link
                          to={`/super-admin/organizations/${org.id}/billing`}
                          className="text-green-700 hover:text-green-900 inline-flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Billing
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredOrganizations.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No organizations found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;