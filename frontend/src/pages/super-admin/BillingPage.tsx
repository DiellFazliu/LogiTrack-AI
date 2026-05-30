// frontend/src/pages/super-admin/BillingPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Calendar, DollarSign, FileText, Building2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface BillingInfo {
  organizationName: string;
  plan_type: string;
  subscription_status: string;
  subscription_ends_at: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  last_invoice_date?: string;
}

export const BillingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);

  useEffect(() => {
    fetchBillingInfo();
  }, [id]);

  const fetchBillingInfo = async () => {
    try {
      const orgRes = await api.get(`/organizations/${id}`);
      const org = orgRes.data;

      let invoiceData = null;
      try {
        const invoiceRes = await api.get(`/invoices/organization/${id}`);
        invoiceData = invoiceRes.data;
      } catch (e) {}

      setBillingInfo({
        organizationName: org.name,
        plan_type: org.plan_type,
        subscription_status: org.subscription_status,
        subscription_ends_at: org.subscription_ends_at,
        amount: getAmountByPlan(org.plan_type),
        currency: 'EUR',
        payment_method: 'Bank Transfer',
        last_invoice_date: invoiceData?.[0]?.created_at,
      });
    } catch (error: any) {
      console.error('Error fetching billing info:', error);
      toast.error(error.response?.data?.message || 'Failed to load billing information');
      navigate('/super-admin/subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const getAmountByPlan = (plan: string): number => {
    switch (plan) {
      case 'free': return 0;
      case 'basic': return 49.99;
      case 'pro': return 99.99;
      case 'enterprise': return 249.99;
      default: return 0;
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!billingInfo) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
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
              <h1 className="text-2xl font-extrabold text-gray-900">Billing & Subscription</h1>
            </div>
          </div>
        </div>

        {/* Subscription Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-700" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">{billingInfo.organizationName}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Plan */}
            <div className="border-l-4 border-blue-600 pl-3">
              <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Current Plan</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1 capitalize">{billingInfo.plan_type}</p>
            </div>

            {/* Status */}
            <div className="border-l-4 border-green-600 pl-3">
              <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Status</p>
              <p className={`text-xl font-extrabold mt-1 capitalize ${billingInfo.subscription_status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                {billingInfo.subscription_status}
              </p>
            </div>

            {/* Monthly Price */}
            <div className="border-l-4 border-purple-600 pl-3">
              <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Monthly Price</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1">{billingInfo.currency} {billingInfo.amount.toFixed(2)}</p>
            </div>

            {/* Renewal / Expiry */}
            <div className="border-l-4 border-orange-600 pl-3">
              <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Renewal / Expiry</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {billingInfo.subscription_ends_at
                  ? new Date(billingInfo.subscription_ends_at).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>

            {/* Payment Method */}
            <div className="border-l-4 border-teal-600 pl-3">
              <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Payment Method</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{billingInfo.payment_method}</p>
            </div>

            {/* Last Invoice */}
            <div className="border-l-4 border-gray-600 pl-3">
              <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Last Invoice</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {billingInfo.last_invoice_date
                  ? new Date(billingInfo.last_invoice_date).toLocaleDateString()
                  : 'No invoices'}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice History Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-700" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Invoice History</h3>
          </div>

          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No invoices available for this organization.</p>
            <p className="text-sm text-gray-500 mt-1">Invoices will appear here once generated.</p>
          </div>
        </div>

        {/* Optional: Info note about billing */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Billing Information</p>
              <p className="text-sm text-blue-700">
                For any billing inquiries or to change subscription, please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};