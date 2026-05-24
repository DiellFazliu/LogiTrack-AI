// frontend/src/pages/super-admin/PlansManagement.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, CreditCard, Calendar, DollarSign, RefreshCw, Users, Package, Edit, Save, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
  { value: 'free', label: 'Free', color: 'bg-gray-100 text-gray-800' },
  { value: 'basic', label: 'Basic', color: 'bg-blue-100 text-blue-800' },
  { value: 'pro', label: 'Pro', color: 'bg-purple-100 text-purple-800' },
  { value: 'enterprise', label: 'Enterprise', color: 'bg-green-100 text-green-800' },
];

const SUBSCRIPTION_STATUS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'trial', label: 'Trial', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' },
];

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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${plan.color}`}>
        {plan.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = SUBSCRIPTION_STATUS.find(s => s.value === status) || SUBSCRIPTION_STATUS[0];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link to="/super-admin/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Organizations & Plans</h1>
                <p className="text-gray-500 mt-1">Manage organizations and their subscription plans</p>
              </div>
            </div>
            <button
              onClick={fetchOrganizations}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Plans</option>
              {PLAN_TYPES.map(plan => (
                <option key={plan.value} value={plan.value}>{plan.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {SUBSCRIPTION_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Organizations</p>
                <p className="text-2xl font-bold">{organizations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold">{organizations.filter(o => o.subscriptionStatus === 'active').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Trial</p>
                <p className="text-2xl font-bold">{organizations.filter(o => o.subscriptionStatus === 'trial').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Expired</p>
                <p className="text-2xl font-bold">{organizations.filter(o => o.subscriptionStatus === 'expired').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No organizations found
                    </td>
                  </tr>
                ) : (
                  filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                          <div className="text-sm text-gray-500">{org.email}</div>
                          {org.phone && <div className="text-xs text-gray-400">{org.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingOrg?.id === org.id ? (
                          <select
                            value={editingOrg.planType}
                            onChange={(e) => setEditingOrg({ ...editingOrg, planType: e.target.value })}
                            className="px-2 py-1 border rounded-lg text-sm"
                          >
                            {PLAN_TYPES.map(plan => (
                              <option key={plan.value} value={plan.value}>{plan.label}</option>
                            ))}
                          </select>
                        ) : (
                          getPlanBadge(org.planType)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(org.subscriptionStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(org.subscriptionEndsAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            <span>Max Users: {org.maxUsers}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-3 h-3" />
                            <span>Shipments/mo: {org.maxShipmentsPerMonth}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {editingOrg?.id === org.id ? (
                            <>
                              <button
                                onClick={() => handleUpdatePlan(org.id, editingOrg.planType)}
                                disabled={updating}
                                className="text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingOrg(null)}
                                className="text-gray-600 hover:text-gray-800"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingOrg(org)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit Plan"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(org.id, org.isActive)}
                                className={`${org.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
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

        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filteredOrganizations.length} of {organizations.length} organizations
        </div>
      </div>
    </div>
  );
};

export default PlansManagement;