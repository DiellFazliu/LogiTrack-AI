// frontend/src/pages/super-admin/SystemSettings.tsx
import React, { useState } from 'react';
import { Save, Globe, Mail, Shield, Database, Users, DollarSign, AlertCircle, RefreshCw, CreditCard, Settings, Bell, Lock, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Toggle switch component
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-800 font-medium">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-10 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        style={{ backgroundColor: checked ? '#1d4ed8' : '#d1d5db' }}
      >
        <span
          className="absolute top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200"
          style={{ left: checked ? '22px' : '2px' }}
        />
      </button>
    </div>
  );
};

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    siteName: 'LogiTrack',
    supportEmail: 'support@logitrack.com',
    defaultPlan: 'free',
    maxUsersPerOrg: 100,
    maxShipmentsPerMonth: 1000,
    maintenanceMode: false,
    enableAIOptimization: true,
    enableChatbot: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('System settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">System Settings</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Configure global system preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-700" />
              General Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Site Name</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Support Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
              <Toggle
                checked={settings.maintenanceMode}
                onChange={(val) => setSettings({ ...settings, maintenanceMode: val })}
                label="Maintenance Mode"
              />
            </div>
          </div>

          {/* Limits & Quotas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-700" />
              Limits & Quotas
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Default Plan</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={settings.defaultPlan}
                    onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Max Users per Organization</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    value={settings.maxUsersPerOrg}
                    onChange={(e) => setSettings({ ...settings, maxUsersPerOrg: parseInt(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Max Shipments per Month (Default)</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    value={settings.maxShipmentsPerMonth}
                    onChange={(e) => setSettings({ ...settings, maxShipmentsPerMonth: parseInt(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-700" />
              Feature Flags
            </h2>
            <div className="space-y-3">
              <Toggle
                checked={settings.enableAIOptimization}
                onChange={(val) => setSettings({ ...settings, enableAIOptimization: val })}
                label="Enable AI Route Optimization"
              />
              <Toggle
                checked={settings.enableChatbot}
                onChange={(val) => setSettings({ ...settings, enableChatbot: val })}
                label="Enable AI Chatbot"
              />
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-700" />
              Payment Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Stripe API Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    placeholder="sk_live_..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Stripe Webhook Secret</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    placeholder="whsec_..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Important</p>
              <p className="text-sm text-blue-700">
                Changes to system settings affect all organizations. Payment settings require valid API keys to function.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};