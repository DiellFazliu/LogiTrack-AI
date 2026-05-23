// src/pages/super-admin/OrganizationDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Users, Package, CreditCard } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/super-admin/organizations" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
            org.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {org.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Basic Information */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Organization Name</p>
                <p className="font-medium">{org.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" /> {org.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" /> {org.phone || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" /> {org.address || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" /> 
                  {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription & Plan */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Subscription & Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Plan Type</p>
                <p className="font-medium capitalize">{org.plan_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subscription Status</p>
                <p className="font-medium capitalize">{org.subscription_status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subscription Ends At</p>
                <p className="font-medium">
                  {org.subscription_ends_at
                    ? new Date(org.subscription_ends_at).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-green-600" />
              Limits & Usage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Max Users</p>
                <p className="font-medium">{org.max_users}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Max Shipments / Month</p>
                <p className="font-medium">{org.max_shipments_per_month}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};