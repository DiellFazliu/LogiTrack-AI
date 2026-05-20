// frontend/src/pages/super-admin/SystemSettings.tsx
import React, { useState } from 'react';
import { Save, Globe, Mail, Shield, Database, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('System settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure global system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" /> General Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Mail className="w-4 h-4" /> Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Maintenance Mode</span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" /> Limits & Quotas
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default Plan</label>
              <select
                value={settings.defaultPlan}
                onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Users per Organization</label>
              <input
                type="number"
                value={settings.maxUsersPerOrg}
                onChange={(e) => setSettings({ ...settings, maxUsersPerOrg: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Shipments per Month (Default)</label>
              <input
                type="number"
                value={settings.maxShipmentsPerMonth}
                onChange={(e) => setSettings({ ...settings, maxShipmentsPerMonth: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Feature Flags
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Enable AI Route Optimization</span>
              <input
                type="checkbox"
                checked={settings.enableAIOptimization}
                onChange={(e) => setSettings({ ...settings, enableAIOptimization: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Enable AI Chatbot</span>
              <input
                type="checkbox"
                checked={settings.enableChatbot}
                onChange={(e) => setSettings({ ...settings, enableChatbot: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Payment Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stripe API Key</label>
              <input
                type="password"
                placeholder="sk_live_..."
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stripe Webhook Secret</label>
              <input
                type="password"
                placeholder="whsec_..."
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;