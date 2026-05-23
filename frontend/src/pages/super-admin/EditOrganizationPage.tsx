// frontend/src/pages/super-admin/EditOrganizationPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan_type: string;
  subscription_status: string;
  subscription_ends_at: string | null;
  max_users: number;
  max_shipments_per_month: number;
  is_active: boolean;
}

export const EditOrganizationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan_type: 'free',
    subscription_status: 'active',
    max_users: 5,
    max_shipments_per_month: 100,
    is_active: true,
  });

  useEffect(() => {
    fetchOrganization();
  }, [id]);

  const fetchOrganization = async () => {
    try {
      const response = await api.get(`/organizations/${id}`);
      const data = response.data;
      setOrg(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        plan_type: data.plan_type || 'free',
        subscription_status: data.subscription_status || 'active',
        max_users: data.max_users || 5,
        max_shipments_per_month: data.max_shipments_per_month || 100,
        is_active: data.is_active !== undefined ? data.is_active : true,
      });
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      toast.error(error.response?.data?.message || 'Failed to load organization');
      navigate('/super-admin/subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/organizations/${id}`, formData);
      toast.success('Organization updated successfully');
      navigate('/super-admin/subscriptions');
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast.error(error.response?.data?.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/super-admin/subscriptions')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <h1 className="text-2xl font-bold">Edit Organization</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
                <select
                  name="plan_type"
                  value={formData.plan_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
                <select
                  name="subscription_status"
                  value={formData.subscription_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                <input
                  type="number"
                  name="max_users"
                  value={formData.max_users}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Shipments / Month</label>
                <input
                  type="number"
                  name="max_shipments_per_month"
                  value={formData.max_shipments_per_month}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Organization is active</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/super-admin/subscriptions')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};