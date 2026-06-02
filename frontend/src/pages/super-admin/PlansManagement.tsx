// frontend/src/pages/super-admin/PlansManagement.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, CreditCard, Calendar, DollarSign, RefreshCw, Users, Package, Edit, Save, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  planType: string;
  subscriptionStatus: string;
  subscriptionEndsAt: string;
  maxUsers: number;
  maxShipmentsPerMonth: number;
  isActive: boolean;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;
  maxShipmentsPerMonth: number;
  maxDrivers: number;
  maxVehicles: number;
  maxWarehouses: number;
  features: string[];
}

const PLAN_TYPES = [
  { value: 'free', label: 'Free', color: 'bg-gray-200 text-gray-800' },
  { value: 'basic', label: 'Basic', color: 'bg-blue-200 text-blue-800' },
  { value: 'pro', label: 'Pro', color: 'bg-purple-200 text-purple-800' },
  { value: 'enterprise', label: 'Enterprise', color: 'bg-green-200 text-green-800' },
];

const SUBSCRIPTION_STATUS = [
  { value: 'active', label: 'Active', color: 'bg-green-200 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-200 text-gray-800' },
  { value: 'trial', label: 'Trial', color: 'bg-yellow-200 text-yellow-800' },
  { value: 'expired', label: 'Expired', color: 'bg-red-200 text-red-800' },
];

// StatCard component
const StatCard = ({ title, value, icon: Icon, bgColor }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10`}
  >
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

export const PlansManagement: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data || []);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (orgId: string, planType: string) => {
    setUpdating(true);
    try {
      await api.patch(`/organizations/${orgId}/plan`, { planType });
      toast.success('Organization plan updated successfully');
      fetchOrganizations();
      setEditingOrg(null);
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast.error(error.response?.data?.message || 'Failed to update plan');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (orgId: string, isActive: boolean) => {
    try {
      await api.put(`/organizations/${orgId}`, { isActive: !isActive });
      toast.success(`Organization ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchOrganizations();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error(error.response?.data?.message || 'Failed to update organization status');
    }
  };

  const getPlanBadge = (planType: string) => {
    const plan = PLAN_TYPES.find(p => p.value === planType) || PLAN_TYPES[0];
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${plan.color}`}>
        {plan.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = SUBSCRIPTION_STATUS.find(s => s.value === status) || SUBSCRIPTION_STATUS[0];
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = searchTerm === '' ||
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'all' || org.planType === planFilter;
    const matchesStatus = statusFilter === 'all' || org.subscriptionStatus === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Stats
  const stats = {
    total: organizations.length,
    activeSubscriptions: organizations.filter(o => o.subscriptionStatus === 'active').length,
    trial: organizations.filter(o => o.subscriptionStatus === 'trial').length,
    expired: organizations.filter(o => o.subscriptionStatus === 'expired').length,
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/super-admin/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h1 className="text-2xl font-extrabold text-gray-900">Organizations & Plans</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">Manage organizations and their subscription plans</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard title="TOTAL ORGANIZATIONS" value={stats.total} icon={Building2} bgColor="bg-blue-800" />
          <StatCard title="ACTIVE SUBSCRIPTIONS" value={stats.activeSubscriptions} icon={CreditCard} bgColor="bg-green-800" />
          <StatCard title="TRIAL" value={stats.trial} icon={Calendar} bgColor="bg-yellow-800" />
          <StatCard title="EXPIRED" value={stats.expired} icon={AlertCircle} bgColor="bg-red-800" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Plans</option>
              {PLAN_TYPES.map(plan => (
                <option key={plan.value} value={plan.value}>{plan.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Statuses</option>
              {SUBSCRIPTION_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Organizations Table */}
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
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium">No organizations found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div>
                          <div className="font-bold text-gray-900">{org.name}</div>
                          <div className="text-sm text-gray-600">{org.email}</div>
                          {org.phone && <div className="text-xs text-gray-500">{org.phone}</div>}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {editingOrg?.id === org.id ? (
                          <select
                            value={editingOrg.planType}
                            onChange={(e) => setEditingOrg({ ...editingOrg, planType: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600"
                          >
                            {PLAN_TYPES.map(plan => (
                              <option key={plan.value} value={plan.value}>{plan.label}</option>
                            ))}
                          </select>
                        ) : (
                          getPlanBadge(org.planType)
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(org.subscriptionStatus)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(org.subscriptionEndsAt)}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            <span>Users: {org.maxUsers}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Package className="w-3.5 h-3.5 text-gray-500" />
                            <span>Shipments/mo: {org.maxShipmentsPerMonth}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {editingOrg?.id === org.id ? (
                            <>
                              <button
                                onClick={() => handleUpdatePlan(org.id, editingOrg.planType)}
                                disabled={updating}
                                className="text-green-700 hover:text-green-900 p-1"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingOrg(null)}
                                className="text-gray-700 hover:text-gray-900 p-1"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingOrg(org)}
                                className="text-blue-700 hover:text-blue-900 p-1"
                                title="Edit Plan"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(org.id, org.isActive)}
                                className={`p-1 ${org.isActive ? 'text-red-700 hover:text-red-900' : 'text-green-700 hover:text-green-900'}`}
                                title={org.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {org.isActive ? <X className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {filteredOrganizations.length} of {organizations.length} organizations
        </div>
      </div>
    </div>
  );
};

export default PlansManagement;