// frontend/src/pages/driver/DriverDailyReport.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, CheckCircle, XCircle, Truck, MapPin, 
  DollarSign, TrendingUp, Clock, Save, Flag, 
  AlertCircle, ArrowLeft, Download 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/driver')} className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Daily Report</h1>
              <p className="text-gray-500 text-sm">View your daily performance and earnings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={fetchDailyReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Load Report
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadReport}
                disabled={!report || report.totalDeliveries === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
              {report && !report.dayConfirmed && report.completedDeliveries > 0 && (
                <button
                  onClick={confirmDay}
                  disabled={confirming}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  {confirming ? 'Confirming...' : 'Confirm Day'}
                </button>
              )}
            </div>
          </div>
        </div>

        {!report || report.totalDeliveries === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No deliveries found</h3>
            <p className="text-gray-500">No deliveries completed on this date.</p>
          </div>
        ) : (
          <>
            {/* Status Banner */}
            {report.dayConfirmed && (
              <div className="bg-green-100 border border-green-400 rounded-lg p-4 mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Day Confirmed!</p>
                  <p className="text-sm text-green-700">You have confirmed the completion of this day.</p>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Deliveries</p>
                    <p className="text-2xl font-bold">{report.totalDeliveries}</p>
                  </div>
                  <Truck className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="text-green-600">✓ {report.completedDeliveries} completed</span>
                  <span className="text-red-600">✗ {report.cancelledDeliveries} cancelled</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Distance</p>
                    <p className="text-2xl font-bold">{report.totalDistance.toFixed(1)} km</p>
                  </div>
                  <MapPin className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Distance driven today</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Time</p>
                    <p className="text-2xl font-bold">{formatDuration(report.totalDuration)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Active driving time</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Earnings</p>
                    <p className="text-2xl font-bold text-green-600">€{report.earnings.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">€{report.completedDeliveries > 0 ? (report.earnings / report.completedDeliveries).toFixed(2) : 0} per delivery</p>
              </div>
            </div>

            {/* Deliveries Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Delivery Details
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.deliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm">{delivery.trackingNumber}</td>
                        <td className="px-4 py-3 text-sm">{delivery.deliveryAddress.substring(0, 50)}...</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            delivery.status === 'delivered' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {delivery.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{delivery.distance.toFixed(1)} km</td>
                        <td className="px-4 py-3 text-sm">{formatDuration(delivery.duration)}</td>
                        <td className="px-4 py-3 text-sm">
                          {delivery.completedAt ? new Date(delivery.completedAt).toLocaleTimeString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};