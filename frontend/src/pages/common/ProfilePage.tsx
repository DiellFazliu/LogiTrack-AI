// src/pages/common/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Shield, Lock, Save } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  organizationId: string | null;
}

export const ProfilePage: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');

  // Profile form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
      setName(response.data.name);
      setPhone(response.data.phone || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      const response = await api.put('/users/me', { name, phone });
      setProfile(response.data);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    setError('');

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password change failed');
      toast.error('Password change failed');
    } finally {
      setChangingPassword(false);
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
            <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">Manage your account information</p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError('')} />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-5 py-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-white" />
                <h2 className="text-base font-bold text-white">Profile Information</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-800 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
              <form onSubmit={handleUpdateProfile}>
                <div className="mb-5">
                  <label className="block text-sm font-bold text-gray-800 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-bold text-gray-800 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                      placeholder="+383 44 123 456"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-800 mb-1">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={profile?.role || ''}
                      disabled
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 capitalize"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full flex justify-center items-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition shadow-md disabled:opacity-50"
                >
                  {updating ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  {updating ? 'Saving...' : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-5 py-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-white" />
                <h2 className="text-base font-bold text-white">Change Password</h2>
              </div>
            </div>
            <div className="p-5">
              <form onSubmit={handleChangePassword}>
                <div className="mb-5">
                  <label className="block text-sm font-bold text-gray-800 mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-bold text-gray-800 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-800 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full flex justify-center items-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg transition shadow-md disabled:opacity-50"
                >
                  {changingPassword ? <LoadingSpinner size="sm" /> : <Lock className="w-4 h-4" />}
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={logout}
            className="text-sm font-semibold text-red-700 hover:text-red-800"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};