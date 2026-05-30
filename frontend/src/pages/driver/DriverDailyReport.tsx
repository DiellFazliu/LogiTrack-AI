// frontend/src/pages/driver/DriverDailyReport.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, CheckCircle, XCircle, Truck, MapPin, 
  DollarSign, TrendingUp, Clock, Save, Flag, 
  AlertCircle, ArrowLeft, Download, Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface DeliverySummary {
  id: string;
  trackingNumber: string;
  deliveryAddress: string;
  status: string;
  completedAt: string;
  distance: number;
  duration: number;
}

interface DailyReport {
  date: string;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  totalDistance: number;
  totalDuration: number;
  earnings: number;
  deliveries: DeliverySummary[];
  dayConfirmed: boolean;
}

// StatCard component
const StatCard = ({ title, value, icon: Icon, bgColor, subtext }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
        <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
        {subtext && <p className="text-[10px] text-white/70 mt-1">{subtext}</p>}
      </div>
      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

export const DriverDailyReport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate]);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/drivers/daily-report?date=${selectedDate}`);
      setReport(response.data);
    } catch (error: any) {
      console.error('Error fetching daily report:', error);
      toast.error(error.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const confirmDay = async () => {
    setConfirming(true);
    try {
      await api.post('/drivers/confirm-day', { date: selectedDate });
      toast.success('Day confirmed successfully!');
      fetchDailyReport();
    } catch (error: any) {
      console.error('Error confirming day:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm day');
    } finally {
      setConfirming(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const reportData = {
      driver: user?.name,
      date: report.date,
      totalDeliveries: report.totalDeliveries,
      completedDeliveries: report.completedDeliveries,
      totalDistance: report.totalDistance,
      totalDuration: report.totalDuration,
      earnings: report.earnings,
      deliveries: report.deliveries
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_report_${report.date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/driver')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h1 className="text-2xl font-extrabold text-gray-900">Daily Report</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">View your daily performance and earnings</p>
        </div>

        {/* Date Selector & Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchDailyReport}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
              >
                Load Report
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadReport}
                disabled={!report || report.totalDeliveries === 0}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
              {report && !report.dayConfirmed && report.completedDeliveries > 0 && (
                <button
                  onClick={confirmDay}
                  disabled={confirming}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  {confirming ? 'Confirming...' : 'Confirm Day'}
                </button>
              )}
            </div>
          </div>
        </div>

        {!report || report.totalDeliveries === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No deliveries found</h3>
            <p className="text-gray-500">No deliveries completed on this date.</p>
          </div>
        ) : (
          <>
            {/* Status Banner */}
            {report.dayConfirmed && (
              <div className="bg-green-100 border border-green-300 rounded-xl p-4 mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-700" />
                <div>
                  <p className="font-bold text-green-800">Day Confirmed!</p>
                  <p className="text-sm text-green-700">You have confirmed the completion of this day.</p>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                title="TOTAL DELIVERIES" 
                value={report.totalDeliveries} 
                icon={Truck} 
                bgColor="bg-blue-800" 
                subtext={`${report.completedDeliveries} completed, ${report.cancelledDeliveries} cancelled`}
              />
              <StatCard 
                title="TOTAL DISTANCE" 
                value={`${report.totalDistance.toFixed(1)} km`} 
                icon={MapPin} 
                bgColor="bg-green-800" 
              />
              <StatCard 
                title="TOTAL TIME" 
                value={formatDuration(report.totalDuration)} 
                icon={Clock} 
                bgColor="bg-yellow-800" 
              />
              <StatCard 
                title="EARNINGS" 
                value={`€${report.earnings.toFixed(2)}`} 
                icon={DollarSign} 
                bgColor="bg-purple-800" 
                subtext={`€${report.completedDeliveries > 0 ? (report.earnings / report.completedDeliveries).toFixed(2) : 0} per delivery`}
              />
            </div>

            {/* Deliveries Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-700" />
                  Delivery Details
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tracking</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Address</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Distance</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Time</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.deliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 whitespace-nowrap font-mono text-sm font-bold text-gray-900">{delivery.trackingNumber}</td>
                        <td className="px-5 py-3 text-sm text-gray-800 max-w-xs truncate">{delivery.deliveryAddress}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            delivery.status === 'delivered' 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-red-200 text-red-800'
                          }`}>
                            {delivery.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-800">{delivery.distance.toFixed(1)} km</td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-800">{formatDuration(delivery.duration)}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-800">
                          {delivery.completedAt ? new Date(delivery.completedAt).toLocaleTimeString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
                Total earnings for this day: <span className="font-bold text-green-700">€{report.earnings.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DriverDailyReport;