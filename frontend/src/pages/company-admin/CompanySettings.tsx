// frontend/src/pages/company/CompanySettings.tsx
import React, { useState, useEffect } from 'react';
import { Save, Bell, Shield, User, Building2, Mail, Phone, MapPin, Globe, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
}

const InfoCard = ({ title, icon: Icon, children, bgColor = 'bg-white' }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${bgColor} rounded-xl shadow-sm border border-gray-200 p-5`}
  >
    <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
      <Icon className="w-5 h-5 text-blue-700" />
      {title}
    </h2>
    {children}
  </motion.div>
);

// Toggle i thjeshtë dhe i qëndrueshëm
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

export const CompanySettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo_url: '',
    notifications_enabled: true,
    email_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/organizations/me');
      const org = response.data;
      setSettings({
        name: org.name || '',
        email: org.email || '',
        phone: org.phone || '',
        address: org.address || '',
        logo_url: org.logo_url || '',
        notifications_enabled: true,
        email_notifications: true,
      });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error(error.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/organizations/me', {
        name: settings.name,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        logo_url: settings.logo_url,
      });
      toast.success('Cilësimet u ruajtën me sukses');
      fetchSettings();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Ruajtja dështoi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Cilësimet e kompanisë</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Menaxhoni profilin e kompanisë dhe preferencat</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InfoCard title="Të dhënat e kompanisë" icon={Building2}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Emri i kompanisë</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Telefoni</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Adresa</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <textarea
                      rows={2}
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Logo URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="url"
                      value={settings.logo_url}
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Preferencat e njoftimeve" icon={Bell}>
              <div className="space-y-2">
                <Toggle
                  checked={settings.notifications_enabled}
                  onChange={(val) => setSettings({ ...settings, notifications_enabled: val })}
                  label="Aktivizo njoftimet"
                />
                <Toggle
                  checked={settings.email_notifications}
                  onChange={(val) => setSettings({ ...settings, email_notifications: val })}
                  label="Njoftime me email"
                />
              </div>
            </InfoCard>
          </div>

          <div className="space-y-6">
            <InfoCard title="Informacioni i planit" icon={Shield}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plani aktual</span>
                  <span className="font-bold text-gray-900">Pro</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Përdoruesit e përdorur</span>
                  <span className="font-bold text-gray-900">5 / 50</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-700 h-2 rounded-full" style={{ width: '10%' }} />
                </div>
                <button className="w-full mt-3 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-lg transition">
                  Përmirëso planin
                </button>
              </div>
            </InfoCard>

            <InfoCard title="Pronari i llogarisë" icon={User}>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Emri</span>
                  <span className="font-medium text-gray-900">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium text-gray-900">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Roli</span>
                  <span className="font-medium text-gray-900 capitalize">{user?.role}</span>
                </div>
              </div>
            </InfoCard>

            {/* Statusi i sistemit – kontrast i lartë */}
            <div className="bg-green-800 rounded-xl shadow-md p-5 border border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-200">Statusi i sistemit</p>
                  <p className="text-2xl font-extrabold text-white mt-1">Operacional</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-green-100 mt-3">Të gjitha sistemet funksionojnë normalisht</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-200">Përditësuar tani</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};