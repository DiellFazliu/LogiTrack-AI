import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Display settings
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  // Organization settings (vetëm për admin)
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  const isAdmin = user?.role === 'company_admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch from localStorage
      const savedTheme = localStorage.getItem('theme');
      const savedLanguage = localStorage.getItem('language');
      if (savedTheme) setTheme(savedTheme);
      if (savedLanguage) setLanguage(savedLanguage);

      // Fetch organization settings for admin
      if (isAdmin && user?.organizationId) {
        const orgRes = await api.get(`/organizations/${user.organizationId}`);
        setCompanyName(orgRes.data.name || '');
        setCompanyAddress(orgRes.data.address || '');
        setCompanyPhone(orgRes.data.phone || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load settings');
      // Nëse përdoruesi ka organizatë (company_admin, dispatcher, driver, customer me org)
      if (user?.organizationId) {
        try {
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
        } catch (err) {
          console.error('Error fetching organization:', err);
          // Nëse endpoint-i nuk ekziston, përdor të dhëna nga user-i
          setSettings({
            name: user?.organizationId || 'My Organization',
            email: user?.email || '',
            phone: user?.phone || '',
            address: '',
            timezone: 'Europe/Tirane',
            dateFormat: 'YYYY-MM-DD',
            currency: 'EUR',
          });
        }
      } else {
        // Për përdorues pa organizatë (customer individual)
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
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      // Save to localStorage
      localStorage.setItem('theme', theme);
      localStorage.setItem('language', language);

      // Apply theme
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Save organization settings for admin
      if (isAdmin && user?.organizationId) {
        await api.put(`/organizations/${user.organizationId}`, {
          name: companyName,
          address: companyAddress,
          phone: companyPhone,
        });
      }

      toast.success('Settings saved successfully');
    setSaving(true);
    setError('');

    try {
      if (user?.organizationId) {
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
        // Për përdorues pa organizatë, përditëso profilin
        await api.put('/users/me', {
          name: settings.name,
          phone: settings.phone,
        });
        toast.success('Profile settings saved successfully');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setUpdating(false);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Notification Settings Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">Email Notifications</span>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">SMS Notifications</span>
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Display Settings Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Display</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="sq">Shqip</option>
              </select>
            </div>
          </div>
        </div>

        {/* Organization Settings Card - vetëm për admin */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Organization</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="md:col-span-2 flex justify-end">
          <button
            onClick={handleSave}
            disabled={updating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {updating ? <LoadingSpinner size="sm" /> : 'Save Settings'}
          </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your organization preferences</p>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSave}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              General Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Organization name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+383 44 123 456"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Street, City, Country"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Regional Settings
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Europe/Tirane">Europe/Tirane (GMT+1)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
                  <option value="America/New_York">America/New_York (GMT-4)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-01-15)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (15/01/2024)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (01/15/2024)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Note */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">ℹ️</div>
          <div>
            <p className="text-sm font-medium text-blue-800">Settings Information:</p>
            <p className="text-sm text-blue-700">
              These settings apply to your entire organization. Changes will affect all users 
              within your organization. For customer accounts without an organization, 
              changes only apply to your personal profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};