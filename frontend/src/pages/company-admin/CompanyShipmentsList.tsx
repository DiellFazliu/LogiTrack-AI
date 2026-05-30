// src/pages/company/CompanyShipmentsList.tsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Eye, Truck, Search, Download, Calendar, 
  Clock, CheckCircle, AlertCircle, XCircle, Filter,
  TrendingUp, Box, MapPin, User, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface Shipment {
  id: string;
  trackingNumber?: string;
  tracking_number?: string;
  customerName?: string;
  customer_name?: string;
  customer_id?: string;
  pickupAddress?: string;
  pickup_address?: string;
  deliveryAddress?: string;
  delivery_address?: string;
  status?: string;
  priority?: string;
  is_express?: boolean;
  weight_kg?: number;
  volume_m3?: number;
  driverName?: string;
  driver_name?: string;
  driver_id?: string;
  estimated_delivery?: string;
  created_at?: string;
  createdAt?: string;
}

interface ShipmentStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  failed: number;
}

// Komponenti i kartës statistikore
const StatCard = ({ title, value, icon: Icon, bgColor }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bgColor} rounded-xl shadow-md p-3 border border-black/10`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
        <p className="text-xl font-extrabold text-white">{value}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </motion.div>
);

export const CompanyShipmentsList = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0, pending: 0, inTransit: 0, delivered: 0, cancelled: 0, failed: 0
  });

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await api.get('/shipments');
      let data = response.data;
      if (data.items) data = data.items;
      if (!Array.isArray(data)) data = [];
      
      setShipments(data);
      
      setStats({
        total: data.length,
        pending: data.filter((s: Shipment) => (s.status || '').toLowerCase() === 'pending').length,
        inTransit: data.filter((s: Shipment) => {
          const status = (s.status || '').toLowerCase();
          return status === 'in_transit' || status === 'picked_up';
        }).length,
        delivered: data.filter((s: Shipment) => (s.status || '').toLowerCase() === 'delivered').length,
        cancelled: data.filter((s: Shipment) => (s.status || '').toLowerCase() === 'cancelled').length,
        failed: data.filter((s: Shipment) => (s.status || '').toLowerCase() === 'failed').length,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const getField = (shipment: Shipment, field: string): string => {
    const camel = field.charAt(0).toLowerCase() + field.slice(1);
    const snake = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return (shipment as any)[camel] ?? (shipment as any)[snake] ?? (shipment as any)[field] ?? '';
  };

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      const trackingNumber = getField(shipment, 'trackingNumber') || getField(shipment, 'tracking_number');
      const customerName = getField(shipment, 'customerName') || getField(shipment, 'customer_name');
      const deliveryAddress = getField(shipment, 'deliveryAddress') || getField(shipment, 'delivery_address');
      const searchLower = search.toLowerCase();
      const matchesSearch = trackingNumber.toLowerCase().includes(searchLower) ||
                           customerName.toLowerCase().includes(searchLower) ||
                           deliveryAddress.toLowerCase().includes(searchLower);
      const status = (shipment.status || '').toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
      const priority = (shipment.priority || '').toLowerCase();
      const matchesPriority = priorityFilter === 'all' || priority === priorityFilter.toLowerCase();
      const createdAt = shipment.created_at || shipment.createdAt;
      const matchesDate = (!dateRange.start || (createdAt && new Date(createdAt) >= new Date(dateRange.start))) &&
                         (!dateRange.end || (createdAt && new Date(createdAt) <= new Date(dateRange.end)));
      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });
  }, [shipments, search, statusFilter, priorityFilter, dateRange]);

  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShipments.slice(start, start + itemsPerPage);
  }, [filteredShipments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);

  const exportToCSV = () => {
    if (filteredShipments.length === 0) {
      toast.error('No data to export');
      return;
    }
    const csv = [
      ['Tracking #', 'Customer', 'Status', 'Priority', 'Weight (kg)', 'Volume (m³)', 'Driver', 'Created Date', 'Est. Delivery'],
      ...filteredShipments.map(s => [
        getField(s, 'tracking_number'),
        getField(s, 'customer_name'),
        s.status || 'N/A',
        s.priority || 'normal',
        s.weight_kg?.toString() || '0',
        s.volume_m3?.toString() || '0',
        s.driver_name || 'Not assigned',
        new Date(s.created_at || s.createdAt || Date.now()).toLocaleDateString(),
        s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-700 text-white',
      picked_up: 'bg-blue-700 text-white',
      in_transit: 'bg-purple-700 text-white',
      delivered: 'bg-green-700 text-white',
      failed: 'bg-red-700 text-white',
      cancelled: 'bg-gray-700 text-white',
    };
    return colors[status || ''] || 'bg-gray-700 text-white';
  };

  const getPriorityColor = (priority?: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-600 text-white',
      normal: 'bg-blue-600 text-white',
      high: 'bg-orange-600 text-white',
      urgent: 'bg-red-600 text-white',
    };
    return colors[priority || 'normal'] || 'bg-gray-600 text-white';
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
                <h1 className="text-2xl font-extrabold text-gray-900">Dërgesat</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Menaxhimi i të gjitha dërgesave të kompanisë</p>
            </div>
            <Link to="/dispatcher/create-shipment">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition">
                <Package className="w-4 h-4" />
                Dërgesë e re
              </button>
            </Link>
          </div>
        </div>

        {/* Statistikat */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <StatCard title="TOTAL" value={stats.total} icon={Package} bgColor="bg-blue-800" />
          <StatCard title="NË PRITJE" value={stats.pending} icon={Clock} bgColor="bg-yellow-800" />
          <StatCard title="NË TRANZIT" value={stats.inTransit} icon={Truck} bgColor="bg-purple-800" />
          <StatCard title="TË DORËZUARA" value={stats.delivered} icon={CheckCircle} bgColor="bg-green-800" />
          <StatCard title="TË DËSHTUARA" value={stats.failed} icon={AlertCircle} bgColor="bg-red-800" />
          <StatCard title="TË ANULUARA" value={stats.cancelled} icon={XCircle} bgColor="bg-gray-800" />
        </div>

        {/* Filtrat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Kërko sipas numrit të gjurmimit, klientit ose adresës..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="all">Të gjitha statuset</option>
                <option value="pending">Në pritje</option>
                <option value="picked_up">Marrë</option>
                <option value="in_transit">Në tranzit</option>
                <option value="delivered">Të dorëzuara</option>
                <option value="failed">Të dështuara</option>
                <option value="cancelled">Të anuluara</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="all">Të gjitha prioritetet</option>
                <option value="low">I ulët</option>
                <option value="normal">Normal</option>
                <option value="high">I lartë</option>
                <option value="urgent">Urgjent</option>
              </select>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Nga data"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Deri më"
              />
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Eksporto
              </button>
            </div>
          </div>
        </div>

        {/* Tabela e dërgesave */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Nr. gjurmimit</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Klienti</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Adresa e marrjes</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Adresa e dorëzimit</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Statusi</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Prioriteti</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Shoferi</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Krijuar më</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Veprimet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedShipments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Nuk u gjet asnjë dërgesë</p>
                    <p className="text-sm mt-1">Ndrysho filtrat ose krijo një dërgesë të re</p>
                  </td>
                </tr>
              ) : (
                paginatedShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {getField(shipment, 'trackingNumber') || getField(shipment, 'tracking_number')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {getField(shipment, 'customerName') || getField(shipment, 'customer_name') || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">ID: {shipment.customer_id?.slice(0, 8) || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 truncate max-w-[150px]" title={getField(shipment, 'pickupAddress') || getField(shipment, 'pickup_address')}>
                        {getField(shipment, 'pickupAddress') || getField(shipment, 'pickup_address') || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 truncate max-w-[150px]" title={getField(shipment, 'deliveryAddress') || getField(shipment, 'delivery_address')}>
                        {getField(shipment, 'deliveryAddress') || getField(shipment, 'delivery_address') || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase text-white ${getStatusColor(shipment.status)}`}>
                        {(shipment.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold text-white ${getPriorityColor(shipment.priority)}`}>
                        {shipment.priority || 'normal'}
                      </span>
                      {shipment.is_express && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-orange-700 text-white">Express</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {shipment.driver_name ? (
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-gray-500" />
                          <span className="text-sm text-gray-700">{shipment.driver_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-yellow-700">Pa caktuar</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{new Date(shipment.created_at || shipment.createdAt || Date.now()).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(shipment.created_at || shipment.createdAt || Date.now()).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/dispatcher/shipments/${shipment.id}`}>
                          <button className="text-blue-700 hover:text-blue-900" title="Shiko detajet">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        {!shipment.driver_id && shipment.status === 'pending' && (
                          <Link to={`/dispatcher/assign-driver?shipment=${shipment.id}`}>
                            <button className="text-green-700 hover:text-green-900" title="Cakto shofer">
                              <Truck className="w-4 h-4" />
                            </button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginimi */}
        {filteredShipments.length > 0 && (
          <div className="mt-5 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Duke shfaqur {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredShipments.length)} nga {filteredShipments.length} dërgesa
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Faqe {currentPage} nga {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyShipmentsList;