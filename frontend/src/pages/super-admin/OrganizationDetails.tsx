// src/pages/super-admin/OrganizationDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Users, Package, CreditCard, AlertCircle } from 'lucide-react';
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
  subscription_ends_at: string;
  max_users: number;
  max_shipments_per_month: number;
  created_at: string;
  is_active: boolean;
}

export const OrganizationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrg();
  }, [id]);

  const fetchOrg = async () => {
    try {
      const res = await api.get(`/organizations/${id}`);
      setOrg(res.data);
    } catch (err) {
      toast.error('Failed to load organization');
      navigate('/super-admin/organizations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!org) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/super-admin/organizations"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h1 className="text-2xl font-extrabold text-gray-900">{org.name}</h1>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                org.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {org.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">Organization details and settings</p>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Basic Information */}
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-700" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-l-4 border-blue-600 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Organization Name</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{org.name}</p>
              </div>
              <div className="border-l-4 border-gray-300 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Email</p>
                <p className="text-md font-medium text-gray-800 mt-1 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-gray-400" /> {org.email}
                </p>
              </div>
              <div className="border-l-4 border-gray-300 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Phone</p>
                <p className="text-md font-medium text-gray-800 mt-1 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" /> {org.phone || '—'}
                </p>
              </div>
              <div className="border-l-4 border-gray-300 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Address</p>
                <p className="text-md font-medium text-gray-800 mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> {org.address || '—'}
                </p>
              </div>
              <div className="border-l-4 border-gray-300 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Created</p>
                <p className="text-md font-medium text-gray-800 mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />{' '}
                  {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription & Plan */}
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-700" />
              Subscription & Plan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-l-4 border-purple-600 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Plan Type</p>
                <p className="text-lg font-bold text-gray-900 mt-1 capitalize">{org.plan_type}</p>
              </div>
              <div className="border-l-4 border-gray-300 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Subscription Status</p>
                <p className="text-md font-medium text-gray-800 mt-1 capitalize">{org.subscription_status}</p>
              </div>
              <div className="border-l-4 border-gray-300 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Subscription Ends At</p>
                <p className="text-md font-medium text-gray-800 mt-1">
                  {org.subscription_ends_at
                    ? new Date(org.subscription_ends_at).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Limits & Usage */}
          <div className="p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-700" />
              Limits & Usage
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-l-4 border-green-600 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Max Users</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{org.max_users}</p>
              </div>
              <div className="border-l-4 border-green-600 pl-3">
                <p className="text-xs font-bold uppercase text-gray-500">Max Shipments / Month</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{org.max_shipments_per_month}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Info Note */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Organization Management</p>
              <p className="text-sm text-blue-700">
                Use the "Edit" button in the organizations list to modify plan, limits, or status. 
                Billing details can be managed from the Billing page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};