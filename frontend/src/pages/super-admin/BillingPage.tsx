// frontend/src/pages/super-admin/BillingPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Calendar, DollarSign, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
      // Fetch organization details
      const orgRes = await api.get(`/organizations/${id}`);
      const org = orgRes.data;

      // Try to fetch billing/invoice data if available
      let invoiceData = null;
      try {
        const invoiceRes = await api.get(`/invoices/organization/${id}`);
        invoiceData = invoiceRes.data;
      } catch (e) {
        // No invoices yet
      }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!billingInfo) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/super-admin/subscriptions')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <h1 className="text-2xl font-bold">Billing & Subscription</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Subscription Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{billingInfo.organizationName}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-lg font-semibold capitalize">{billingInfo.plan_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`text-lg font-semibold capitalize ${billingInfo.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {billingInfo.subscription_status}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Price</p>
              <p className="text-lg font-semibold">{billingInfo.currency} {billingInfo.amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Renewal / Expiry</p>
              <p className="text-lg font-semibold">
                {billingInfo.subscription_ends_at
                  ? new Date(billingInfo.subscription_ends_at).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="text-lg font-semibold">{billingInfo.payment_method}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Invoice</p>
              <p className="text-lg font-semibold">
                {billingInfo.last_invoice_date
                  ? new Date(billingInfo.last_invoice_date).toLocaleDateString()
                  : 'No invoices yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice History (Placeholder) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Invoice History</h3>
          </div>
          <div className="text-center py-8 text-gray-500">
            <p>No invoices available for this organization.</p>
            <p className="text-sm mt-2">Invoices will appear here once generated.</p>
          </div>
        </div>
      </div>
    </div>
  );
};