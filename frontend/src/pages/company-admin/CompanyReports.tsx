// src/pages/company/CompanyReports.tsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { 
  Download, 
  TrendingUp, 
  Truck, 
  Package, 
  DollarSign, 
  FileText, 
  Clock, 
  Star, 
  AlertCircle, 
  RefreshCw,
  Eye,
  X,
  Calendar,
  BarChart3,
  Users,
  Car
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface ReportStats {
  totalShipments: number;
  completedShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  totalDrivers: number;
  activeDrivers: number;
  totalVehicles: number;
  availableVehicles: number;
  avgDeliveryTime: number;
  onTimeDelivery: number;
  totalRevenue: number;
  avgDriverRating: number;
  totalReviews: number;
}

interface SavedReport {
  id: string;
  type: string;
  title: string;
  data: any;
  fileUrl: string | null;
  generatedAt: string;
  generatedBy?: {
    name: string;
    email: string;
  };
}

// Komponenti i kartës statistikore
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

export const CompanyReports: React.FC = () => {
  const [stats, setStats] = useState<ReportStats>({
    totalShipments: 0,
    completedShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    avgDeliveryTime: 0,
    onTimeDelivery: 0,
    totalRevenue: 0,
    avgDriverRating: 0,
    totalReviews: 0,
  });
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState<'shipment' | 'driver' | 'financial'>('shipment');
  const [reportData, setReportData] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchSavedReports();
  }, []);

  const fetchReports = async () => {
    try {
      const extractData = (res: any) => {
        if (res.data?.items) return res.data.items;
        if (res.data?.data) return res.data.data;
        if (Array.isArray(res.data)) return res.data;
        return [];
      };

      const [shipmentsRes, driversRes, vehiclesRes, reviewsRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/drivers'),
        api.get('/vehicles'),
        api.get('/reviews/driver/average/all').catch(() => ({ data: { average: 0, total: 0 } }))
      ]);
      
      const shipments = extractData(shipmentsRes);
      const drivers = extractData(driversRes);
      const vehicles = extractData(vehiclesRes);
      
      const completedShipments = shipments.filter((s: any) => s.status === 'delivered').length;
      const pendingShipments = shipments.filter((s: any) => s.status === 'pending').length;
      const inTransitShipments = shipments.filter((s: any) => s.status === 'in_transit' || s.status === 'picked_up').length;
      const totalShipments = shipments.length;
      
      const totalDrivers = drivers.length;
      const activeDrivers = drivers.filter((d: any) => d.status === 'available' || d.status === 'on_duty').length;
      
      const totalVehicles = vehicles.length;
      const availableVehicles = vehicles.filter((v: any) => v.status === 'available').length;
      
      const totalRevenue = completedShipments * 50;
      
      setStats({
        totalShipments,
        completedShipments,
        pendingShipments,
        inTransitShipments,
        totalDrivers,
        activeDrivers,
        totalVehicles,
        availableVehicles,
        avgDeliveryTime: 2.5,
        onTimeDelivery: 94,
        totalRevenue,
        avgDriverRating: reviewsRes.data?.average || 0,
        totalReviews: reviewsRes.data?.total || 0,
      });
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedReports = async () => {
    try {
      const response = await api.get('/reports');
      setSavedReports(response.data || []);
    } catch (error) {
      console.error('Error fetching saved reports:', error);
    }
  };

  const generateCustomReport = async () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error('Please select start and end date');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/reports/custom', {
        startDate: dateRange.start,
        endDate: dateRange.end,
        type: reportType,
      });
      
      toast.success(`${reportType.toUpperCase()} report generated successfully!`);
      fetchSavedReports();
      
      setReportData(response.data.data);
      setSelectedReport(response.data);
      setShowReportModal(true);
      
    } catch (error: any) {
      console.error('Error generating custom report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: string, fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      try {
        const response = await api.get(`/reports/${reportId}/download`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        toast.error('Failed to download report');
      }
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`/reports/${reportId}`);
      toast.success('Report deleted');
      fetchSavedReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const viewReport = async (reportId: string) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      setReportData(response.data.data);
      setSelectedReport(response.data);
      setShowReportModal(true);
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report');
    }
  };

  const refreshStats = () => {
    fetchReports();
    toast.success('Statistics refreshed');
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Raportet & Analiza</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Shikoni performancën e kompanisë dhe gjeneroni raporte</p>
            </div>
            <button
              onClick={refreshStats}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Rifresko
            </button>
          </div>
        </div>

        {/* Panel filtrash dhe gjenerimi i raporteve */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Data e fillimit</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Data e mbarimit</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Lloji i raportit</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="shipment">Raport i dërgesave</option>
                <option value="driver">Raport i performancës së shoferëve</option>
                <option value="financial">Raport financiar</option>
              </select>
            </div>
            <button
              onClick={generateCustomReport}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {generating ? 'Po gjenerohet...' : 'Gjenero raport'}
            </button>
          </div>
        </div>

        {/* Kartat statistikore (rreshti i parë) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard title="DËRGESAT TOTALE" value={stats.totalShipments} icon={Package} bgColor="bg-blue-800" subtext={`${stats.completedShipments} të dorëzuara`} />
          <StatCard title="DORËZIMI NË KOHË" value={`${stats.onTimeDelivery}%`} icon={Clock} bgColor="bg-green-800" subtext="+2% nga muaji i kaluar" />
          <StatCard title="SHOFERË AKTIVË" value={`${stats.activeDrivers} / ${stats.totalDrivers}`} icon={Truck} bgColor="bg-purple-800" />
          <StatCard title="VLERËSIMI I SHOFERËVE" value={`${stats.avgDriverRating.toFixed(1)} ★`} icon={Star} bgColor="bg-yellow-800" subtext={`Bazuar në ${stats.totalReviews} komente`} />
        </div>

        {/* Kartat statistikore (rreshti i dytë) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <StatCard title="AUTOMJETE TË LIRA" value={`${stats.availableVehicles} / ${stats.totalVehicles}`} icon={Car} bgColor="bg-teal-800" />
          <StatCard title="TË ARDHURAT TOTALE" value={`€${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} bgColor="bg-emerald-800" subtext="Viti aktual" />
          <StatCard title="KOHË MESATARE DORËZIMI" value={`${stats.avgDeliveryTime} ditë`} icon={AlertCircle} bgColor="bg-orange-800" />
        </div>

        {/* Grafikët (Shipment Status + Performance) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Shpërndarja e statuseve të dërgesave */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-700" />
              Shpërndarja e statuseve të dërgesave
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Të dorëzuara</span>
                  <span className="font-bold text-gray-900">{stats.completedShipments} ({Math.round((stats.completedShipments / stats.totalShipments) * 100) || 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(stats.completedShipments / stats.totalShipments) * 100 || 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Në tranzit</span>
                  <span className="font-bold text-gray-900">{stats.inTransitShipments} ({Math.round((stats.inTransitShipments / stats.totalShipments) * 100) || 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats.inTransitShipments / stats.totalShipments) * 100 || 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Në pritje</span>
                  <span className="font-bold text-gray-900">{stats.pendingShipments} ({Math.round((stats.pendingShipments / stats.totalShipments) * 100) || 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${(stats.pendingShipments / stats.totalShipments) * 100 || 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Performanca e shoferëve dhe automjeteve */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-700" />
              Performanca e shoferëve dhe automjeteve
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Shfrytëzimi i shoferëve</span>
                  <span className="font-bold text-gray-900">{Math.round((stats.activeDrivers / stats.totalDrivers) * 100) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats.activeDrivers / stats.totalDrivers) * 100 || 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Shfrytëzimi i automjeteve</span>
                  <span className="font-bold text-gray-900">{Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100 || 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Vlerësimi mesatar i shoferëve</span>
                  <span className="font-bold text-gray-900">{stats.avgDriverRating.toFixed(1)} ★</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${(stats.avgDriverRating / 5) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Raportet e ruajtura */}
        {savedReports.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" />
              Raportet e ruajtura
            </h2>
            <div className="space-y-2">
              {savedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-800">{report.title}</p>
                    <p className="text-xs text-gray-500">
                      Lloji: {report.type} | Gjeneruar: {new Date(report.generatedAt).toLocaleString()}
                      {report.generatedBy && ` | Nga: ${report.generatedBy.name || report.generatedBy.email}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => viewReport(report.id)} className="p-1.5 text-green-700 hover:bg-green-50 rounded-lg transition" title="Shiko">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => downloadReport(report.id, report.fileUrl!)} className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition" title="Shkarko">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteReport(report.id)} className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg transition" title="Fshij">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal për shfaqjen e raportit */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowReportModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{selectedReport.title}</h2>
                <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Raporti i dërgesave */}
                {selectedReport.type === 'shipment' && reportData?.shipments && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">Detajet e dërgesave</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">Nr. gjurmimit</th>
                            <th className="px-4 py-2 text-left font-semibold">Statusi</th>
                            <th className="px-4 py-2 text-left font-semibold">Marrja</th>
                            <th className="px-4 py-2 text-left font-semibold">Dorëzimi</th>
                            <th className="px-4 py-2 text-left font-semibold">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.shipments.map((shipment: any) => (
                            <tr key={shipment.id} className="border-t">
                              <td className="px-4 py-2 font-mono">{shipment.trackingNumber}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {shipment.status}
                                </span>
                              </td>
                              <td className="px-4 py-2">{shipment.pickupAddress?.substring(0, 50)}...</td>
                              <td className="px-4 py-2">{shipment.deliveryAddress?.substring(0, 50)}...</td>
                              <td className="px-4 py-2">{new Date(shipment.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-700">{reportData.shipmentStats?.total || 0}</p>
                        <p className="text-xs text-gray-600">Total dërgesa</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-700">{reportData.shipmentStats?.delivered || 0}</p>
                        <p className="text-xs text-gray-600">Të dorëzuara</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-700">{reportData.shipmentStats?.pending || 0}</p>
                        <p className="text-xs text-gray-600">Në pritje</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raporti i shoferëve */}
                {selectedReport.type === 'driver' && reportData?.drivers && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">Detajet e shoferëve</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">Emri</th>
                            <th className="px-4 py-2 text-left font-semibold">Licenca</th>
                            <th className="px-4 py-2 text-left font-semibold">Telefoni</th>
                            <th className="px-4 py-2 text-left font-semibold">Statusi</th>
                            <th className="px-4 py-2 text-left font-semibold">Dërgesa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.drivers.map((driver: any) => (
                            <tr key={driver.id} className="border-t">
                              <td className="px-4 py-2">{driver.user?.name || 'N/A'}</td>
                              <td className="px-4 py-2">{driver.licenseNumber}</td>
                              <td className="px-4 py-2">{driver.phone}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  driver.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {driver.status}
                                </span>
                              </td>
                              <td className="px-4 py-2">{driver.totalDeliveries || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Raporti financiar */}
                {selectedReport.type === 'financial' && reportData && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">Përmbledhja financiare</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-700">€{reportData.totalRevenue || 0}</p>
                        <p className="text-xs text-gray-600">Të ardhurat totale</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-700">{reportData.totalShipments || 0}</p>
                        <p className="text-xs text-gray-600">Total dërgesa</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-700">{reportData.completedShipments || 0}</p>
                        <p className="text-xs text-gray-600">Të dorëzuara</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-700">{reportData.onTimeDelivery || 0}%</p>
                        <p className="text-xs text-gray-600">Dorëzimi në kohë</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => downloadReport(selectedReport.id, selectedReport.fileUrl!)}
                    className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2 font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    Shkarko raportin
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Mbylle
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyReports;