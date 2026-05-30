// frontend/src/pages/super-admin/SubscriptionsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, CheckCircle, XCircle, Clock, AlertTriangle, 
  CreditCard, Edit, RefreshCw, Search, Filter, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' };
      case 'inactive':
        return { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Inactive' };
      case 'trial':
        return { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Trial' };
      case 'expired':
        return { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Expired' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: status || 'Unknown' };
    }
  };

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
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
              <h1 className="text-3xl font-bold text-gray-800">Subscriptions Management</h1>
              <p className="text-gray-500 mt-1">Manage organization plans and billing</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Organizations</p>
                <p className="text-2xl font-bold">{totalOrgs}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-600">{activeSubscriptions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Trial Periods</p>
                <p className="text-2xl font-bold text-blue-600">{trialSubscriptions}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredSubscriptions}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by organization name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limits</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.map((org) => {
                  const StatusBadge = getStatusBadge(org.subscription_status);
                  const planName = org.plan_type ? org.plan_type.charAt(0).toUpperCase() + org.plan_type.slice(1) : 'Free';
                  return (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{org.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{org.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadge(org.plan_type)}`}>
                          {planName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${StatusBadge.color}`}>
                          <StatusBadge.icon className="w-3 h-3" />
                          {StatusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {org.subscription_ends_at ? new Date(org.subscription_ends_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>👥 {org.max_users ?? 0} users</div>
                        <div>📦 {org.max_shipments_per_month ?? 0} shipments/mo</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/super-admin/organizations/${org.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit className="w-4 h-4 inline" /> Edit
                        </Link>
                        <Link
                          to={`/super-admin/organizations/${org.id}/billing`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CreditCard className="w-4 h-4 inline" /> Billing
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
              <p className="text-gray-500">No organizations found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;