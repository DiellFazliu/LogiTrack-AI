// frontend/src/pages/super-admin/OrganizationsList.tsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, Building2, Users, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan_type: string;
  subscription_status: string;
  subscription_ends_at: string;
  max_users: number;
  max_shipments_per_month: number;
  logo_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// StatCard component
const StatCard = ({ title, value, icon: Icon, bgColor, description }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10`}
  >
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
  </motion.div>
);

export const OrganizationsList: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      let orgsData = response.data;
      
      const mapOrganization = (org: any): Organization => ({
        id: org.id,
        name: org.name,
        email: org.email,
        phone: org.phone || '',
        address: org.address || '',
        plan_type: org.planType || org.plan_type || 'free',
        subscription_status: org.subscriptionStatus || org.subscription_status || 'trial',
        subscription_ends_at: org.subscriptionEndsAt || org.subscription_ends_at,
        max_users: org.maxUsers || org.max_users || 5,
        max_shipments_per_month: org.maxShipmentsPerMonth || org.max_shipments_per_month || 100,
        logo_url: org.logoUrl || org.logo_url || '',
        is_active: org.isActive !== undefined ? org.isActive : org.is_active,
        created_at: org.createdAt || org.created_at,
        updated_at: org.updatedAt || org.updated_at,
      });

      if (Array.isArray(orgsData)) {
        setOrganizations(orgsData.map(mapOrganization));
      } else if (orgsData.items) {
        setOrganizations(orgsData.items.map(mapOrganization));
      } else if (orgsData.data) {
        setOrganizations(orgsData.data.map(mapOrganization));
      } else {
        setOrganizations([]);
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view organizations');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch organizations');
      }
      setOrganizations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrganizations();
    toast.success('Organizations refreshed');
  };

  const deleteOrganization = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/organizations/${id}`);
      toast.success('Organization deleted successfully');
      await fetchOrganizations();
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to delete this organization');
      } else if (error.response?.status === 404) {
        toast.error('Organization not found');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete organization');
      }
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setSelectedOrg(null);
    }
  };

  const toggleOrganizationStatus = async (id: string, currentStatus: boolean) => {
    setUpdatingStatusId(id);
    try {
      await api.put(`/organizations/${id}`, { isActive: !currentStatus });
      toast.success(`Organization ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      await fetchOrganizations();
    } catch (error: any) {
      console.error('Error updating organization status:', error);
      toast.error(error.response?.data?.message || 'Failed to update organization status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const updatePlan = async (id: string, planType: string) => {
    setUpdatingPlanId(id);
    try {
      await api.patch(`/organizations/${id}/plan`, { planType });
      toast.success(`Plan updated to ${planType}`);
      await fetchOrganizations();
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast.error(error.response?.data?.message || 'Failed to update plan');
    } finally {
      setUpdatingPlanId(null);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-200 text-gray-800',
      basic: 'bg-blue-200 text-blue-800',
      pro: 'bg-purple-200 text-purple-800',
      enterprise: 'bg-yellow-200 text-yellow-800',
    };
    return colors[plan] || 'bg-gray-200 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-200 text-green-800',
      inactive: 'bg-red-200 text-red-800',
      trial: 'bg-yellow-200 text-yellow-800',
      expired: 'bg-gray-200 text-gray-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const getActiveStatusBadge = (isActive: boolean) => {
    return isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) ||
                         org.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === 'all' || org.plan_type === planFilter;
    const matchesStatus = statusFilter === 'all' || org.subscription_status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const stats = {
    total: organizations.length,
    totalUserSlots: organizations.reduce((sum, org) => sum + (org.max_users || 0), 0),
    activeSubscriptions: organizations.filter(org => org.subscription_status === 'active').length,
    enterprisePlans: organizations.filter(org => org.plan_type === 'enterprise').length,
  };

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
                <h1 className="text-2xl font-extrabold text-gray-900">Organizations</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Manage all companies on the platform</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => navigate('/super-admin/organizations/create')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition"
              >
                <Plus className="w-4 h-4" />
                Add Organization
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard title="TOTAL ORGANIZATIONS" value={stats.total} icon={Building2} bgColor="bg-blue-800" description="Companies" />
          <StatCard title="TOTAL USER SLOTS" value={stats.totalUserSlots} icon={Users} bgColor="bg-green-800" description="Across all orgs" />
          <StatCard title="ACTIVE SUBS" value={stats.activeSubscriptions} icon={CreditCard} bgColor="bg-purple-800" description="Subscriptions" />
          <StatCard title="ENTERPRISE" value={stats.enterprisePlans} icon={Building2} bgColor="bg-yellow-800" description="Enterprise plans" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={statusFilter === 'active' ? 'active' : statusFilter === 'inactive' ? 'inactive' : 'all'}
              onChange={(e) => {
                if (e.target.value === 'active') setStatusFilter('active');
                else if (e.target.value === 'inactive') setStatusFilter('inactive');
                else setStatusFilter('all');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All (Active/Inactive)</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredOrgs.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No organizations found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or create a new organization</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Organization</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contact</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Plan</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Subscription</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Active</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Max Users</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Created</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div>
                          <div className="font-bold text-gray-900">{org.name}</div>
                          <div className="text-xs text-gray-500 font-mono">ID: {org.id.slice(0, 8)}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{org.email}</p>
                          {org.phone && <p className="text-xs text-gray-500">{org.phone}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={org.plan_type}
                          onChange={(e) => updatePlan(org.id, e.target.value)}
                          disabled={updatingPlanId === org.id}
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getPlanBadgeColor(org.plan_type)} border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50`}
                        >
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        {updatingPlanId === org.id && (
                          <span className="ml-2 text-xs text-gray-400">Updating...</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(org.subscription_status)}`}>
                          {org.subscription_status}
                        </span>
                        {org.subscription_ends_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires: {new Date(org.subscription_ends_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleOrganizationStatus(org.id, org.is_active)}
                          disabled={updatingStatusId === org.id}
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getActiveStatusBadge(org.is_active)} transition hover:opacity-70 disabled:opacity-50`}
                        >
                          {updatingStatusId === org.id ? 'Updating...' : (org.is_active ? 'Active' : 'Inactive')}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{org.max_users || 0}</p>
                          <p className="text-xs text-gray-500">max users</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(org.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
                            className="text-blue-700 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/super-admin/organizations/${org.id}/edit`)}
                            className="text-green-700 hover:text-green-900 p-1"
                            title="Edit Organization"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setShowDeleteModal(true);
                            }}
                            disabled={deletingId === org.id}
                            className="text-red-700 hover:text-red-900 p-1 disabled:opacity-50"
                            title="Delete Organization"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-2">
            <p className="text-sm text-gray-600">
              Showing {filteredOrgs.length} of {organizations.length} organizations
            </p>
            <div className="flex gap-1">
              {['free', 'basic', 'pro', 'enterprise'].map(plan => {
                const count = organizations.filter(o => o.plan_type === plan).length;
                if (count === 0) return null;
                return (
                  <span key={plan} className="px-2 py-1 bg-gray-200 rounded-md text-xs font-medium text-gray-700">
                    {plan}: {count}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">About Organizations:</p>
              <p className="text-sm text-blue-700">
                Each organization represents a company tenant. You can manage their subscriptions,
                user limits, and system access from this page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedOrg(null);
        }}
        onConfirm={() => selectedOrg && deleteOrganization(selectedOrg.id)}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${selectedOrg?.name}"? This will permanently delete all users, drivers, vehicles, shipments, and associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default OrganizationsList;