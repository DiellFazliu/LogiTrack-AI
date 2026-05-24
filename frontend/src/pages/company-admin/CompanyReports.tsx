// frontend/src/pages/company/CompanyReports.tsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
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
  X
} from 'lucide-react';

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

// frontend/src/pages/company/CompanyReports.tsx
// Zëvendëso pjesën e totalRevenue në fetchReports:

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
    
    // ✅ Llogarit revenue nga shipment-et e dorëzuara (€50 për shipment)
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
      totalRevenue,  // ✅ Tani do të jetë completedShipments * 50
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">View your company performance metrics and generate reports</p>
          </div>
          <button
            onClick={refreshStats}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Filter & Report Generation */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="shipment">Shipment Report</option>
              <option value="driver">Driver Performance Report</option>
              <option value="financial">Financial Report</option>
            </select>
          </div>
          <button
            onClick={generateCustomReport}
            disabled={generating}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Shipments</p>
              <p className="text-2xl font-bold">{stats.totalShipments}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-green-600">✓ {stats.completedShipments} completed</span>
            <span className="text-yellow-600">⏳ {stats.pendingShipments} pending</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">On-Time Delivery</p>
              <p className="text-2xl font-bold text-green-600">{stats.onTimeDelivery}%</p>
            </div>
            <Clock className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">+2% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Drivers</p>
              <p className="text-2xl font-bold">{stats.activeDrivers} / {stats.totalDrivers}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-purple-500 h-1.5 rounded-full" 
              style={{ width: `${stats.totalDrivers ? (stats.activeDrivers / stats.totalDrivers) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Driver Rating</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.avgDriverRating.toFixed(1)} ★</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Based on {stats.totalReviews} reviews</p>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Available Vehicles</p>
              <p className="text-2xl font-bold">{stats.availableVehicles} / {stats.totalVehicles}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-yellow-500 h-1.5 rounded-full" 
              style={{ width: `${stats.totalVehicles ? (stats.availableVehicles / stats.totalVehicles) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">€{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Year to date</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Delivery Time</p>
              <p className="text-2xl font-bold">{stats.avgDeliveryTime} days</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '65%' }} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Shipment Status Distribution</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Delivered</span>
                <span>{stats.completedShipments} ({Math.round((stats.completedShipments / stats.totalShipments) * 100) || 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.completedShipments / stats.totalShipments) * 100 || 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>In Transit</span>
                <span>{stats.inTransitShipments} ({Math.round((stats.inTransitShipments / stats.totalShipments) * 100) || 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.inTransitShipments / stats.totalShipments) * 100 || 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Pending</span>
                <span>{stats.pendingShipments} ({Math.round((stats.pendingShipments / stats.totalShipments) * 100) || 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.pendingShipments / stats.totalShipments) * 100 || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Driver & Vehicle Performance</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Driver Utilization</span>
                <span>{Math.round((stats.activeDrivers / stats.totalDrivers) * 100) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.activeDrivers / stats.totalDrivers) * 100 || 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Vehicle Utilization</span>
                <span>{Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100 || 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Driver Rating</span>
                <span>{stats.avgDriverRating.toFixed(1)} ★</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.avgDriverRating / 5) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Saved Reports
          </h2>
          <div className="space-y-3">
            {savedReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-gray-500">
                    Type: {report.type} | Generated: {new Date(report.generatedAt).toLocaleString()}
                    {report.generatedBy && ` | By: ${report.generatedBy.name || report.generatedBy.email}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => viewReport(report.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadReport(report.id, report.fileUrl!)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
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

      {/* Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{selectedReport.title}</h2>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Shipment Report */}
              {selectedReport.type === 'shipment' && reportData?.shipments && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Shipment Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Tracking</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Pickup</th>
                          <th className="px-4 py-2 text-left">Delivery</th>
                          <th className="px-4 py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.shipments.map((shipment: any) => (
                          <tr key={shipment.id} className="border-t">
                            <td className="px-4 py-2 font-mono">{shipment.trackingNumber}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
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
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-blue-600">{reportData.shipmentStats?.total || 0}</p>
                      <p className="text-xs text-gray-500">Total Shipments</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-green-600">{reportData.shipmentStats?.delivered || 0}</p>
                      <p className="text-xs text-gray-500">Delivered</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-yellow-600">{reportData.shipmentStats?.pending || 0}</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Driver Report */}
              {selectedReport.type === 'driver' && reportData?.drivers && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Driver Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">License</th>
                          <th className="px-4 py-2 text-left">Phone</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Deliveries</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.drivers.map((driver: any) => (
                          <tr key={driver.id} className="border-t">
                            <td className="px-4 py-2">{driver.user?.name || 'N/A'}</td>
                            <td className="px-4 py-2">{driver.licenseNumber}</td>
                            <td className="px-4 py-2">{driver.phone}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
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

              {/* Financial Report */}
              {selectedReport.type === 'financial' && reportData && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Financial Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded text-center">
                      <p className="text-2xl font-bold text-green-600">€{reportData.totalRevenue || 0}</p>
                      <p className="text-xs text-gray-500">Total Revenue</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded text-center">
                      <p className="text-2xl font-bold text-blue-600">{reportData.totalShipments || 0}</p>
                      <p className="text-xs text-gray-500">Total Shipments</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded text-center">
                      <p className="text-2xl font-bold text-purple-600">{reportData.completedShipments || 0}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded text-center">
                      <p className="text-2xl font-bold text-yellow-600">{reportData.onTimeDelivery || 0}%</p>
                      <p className="text-xs text-gray-500">On-Time Delivery</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => downloadReport(selectedReport.id, selectedReport.fileUrl!)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyReports;