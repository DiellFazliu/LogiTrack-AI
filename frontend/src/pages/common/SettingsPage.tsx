// frontend/src/pages/common/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Mail, Phone, MapPin, Clock, DollarSign, Save, Globe } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Settings {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  logo?: string;
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<Settings>({
    name: '',
    email: '',
    phone: '',
    address: '',
    timezone: 'Europe/Tirane',
    dateFormat: 'YYYY-MM-DD',
    currency: 'EUR',
  });

  const isAdmin = user?.role === 'company_admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      if (isAdmin && user?.organizationId) {
        const response = await api.get(`/organizations/${user.organizationId}`);
        const org = response.data;
        setSettings({
          id: org.id,
          name: org.name || '',
          email: org.email || '',
          phone: org.phone || '',
          address: org.address || '',
          timezone: org.timezone || 'Europe/Tirane',
          dateFormat: org.date_format || 'YYYY-MM-DD',
          currency: org.currency || 'EUR',
          logo: org.logo_url || '',
        });
      } else {
        setSettings({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          address: '',
          timezone: 'Europe/Tirane',
          dateFormat: 'YYYY-MM-DD',
          currency: 'EUR',
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setSettings({
        name: user?.name || user?.organizationId || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        timezone: 'Europe/Tirane',
        dateFormat: 'YYYY-MM-DD',
        currency: 'EUR',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isAdmin && user?.organizationId) {
        await api.put(`/organizations/${user.organizationId}`, {
          name: settings.name,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          timezone: settings.timezone,
          date_format: settings.dateFormat,
          currency: settings.currency,
        });
        toast.success('Organization settings saved successfully');
      } else {
        await api.put('/users/me', {
          name: settings.name,
          phone: settings.phone,
        });
        toast.success('Profile settings saved successfully');
      }
      await fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-700 rounded-full" />
            <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">Manage your organization preferences</p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError('')} />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSave}>
            {/* General Information Section */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-5 py-3 border-b border-gray-200">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                General Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Organization Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                      placeholder="Organization name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                      placeholder="+383 44 123 456"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                      placeholder="Street, City, Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Regional Settings Section */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-5 py-3 border-t border-gray-200">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Regional Settings
              </h2>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="Europe/Tirane">Europe/Tirane (GMT+1)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
                    <option value="America/New_York">America/New_York (GMT-4)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-01-15)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (15/01/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (01/15/2024)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Currency
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="CHF">CHF (Fr) - Swiss Franc</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-md transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5">ℹ️</div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Settings Information:</p>
              <p className="text-sm text-blue-700">
                These settings apply to your entire organization. Changes will affect all users
                within your organization. For customer accounts without an organization,
                changes only apply to your personal profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};