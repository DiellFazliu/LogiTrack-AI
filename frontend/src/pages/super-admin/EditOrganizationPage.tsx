// frontend/src/pages/super-admin/EditOrganizationPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Save, ArrowLeft, AlertCircle, Mail, Phone, MapPin, Users, Package, CreditCard, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

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

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/super-admin/subscriptions')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h1 className="text-2xl font-extrabold text-gray-900">Edit Organization</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">Update organization details and settings</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Organization Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-1">Organization Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Plan Type */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Plan Type</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <select
                  name="plan_type"
                  value={formData.plan_type}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* Subscription Status */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Subscription Status</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <select
                  name="subscription_status"
                  value={formData.subscription_status}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Max Users */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Max Users</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="number"
                  name="max_users"
                  value={formData.max_users}
                  onChange={handleChange}
                  min="1"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Max Shipments / Month */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Max Shipments / Month</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="number"
                  name="max_shipments_per_month"
                  value={formData.max_shipments_per_month}
                  onChange={handleChange}
                  min="1"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm font-medium text-gray-800">Organization is active</label>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Important</p>
                <p className="text-sm text-blue-700">
                  Changes to plan type and limits will affect the organization's available features and user quotas.
                  Subscription status determines whether the organization can access the system.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/super-admin/subscriptions')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center gap-2"
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