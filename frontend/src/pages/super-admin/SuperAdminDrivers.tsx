// frontend/src/pages/super-admin/SuperAdminDrivers.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, User, Phone, Mail, AlertCircle, RefreshCw, Users, Truck, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Driver {
  id: string;
  licenseNumber: string;
  phone: string;
  status: string;
  rating: number;
  totalDeliveries: number;
  user?: {
    name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

// StatCard component
const StatCard = ({ title, value, icon: Icon, bgColor }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
        <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

export const SuperAdminDrivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const orgsRes = await api.get('/organizations');
      const organizations = orgsRes.data || [];

      let allDrivers: Driver[] = [];
      for (const org of organizations) {
        try {
          const driversRes = await api.get(`/organizations/${org.id}/drivers`);
          const orgDrivers = driversRes.data || [];
          const driversWithOrg = orgDrivers.map((d: any) => ({
            ...d,
            organization: { id: org.id, name: org.name },
          }));
          allDrivers = [...allDrivers, ...driversWithOrg];
        } catch (e) {
          console.log(`Could not fetch drivers for org ${org.id}`);
        }
      }

      setDrivers(allDrivers);
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDrivers();
    setRefreshing(false);
    toast.success('Drivers list refreshed');
  };

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      searchTerm === '' ||
      driver.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: 'bg-green-200 text-green-800',
      on_duty: 'bg-blue-200 text-blue-800',
      on_break: 'bg-yellow-200 text-yellow-800',
      off_duty: 'bg-gray-200 text-gray-800',
      sick: 'bg-red-200 text-red-800',
      vacation: 'bg-purple-200 text-purple-800',
    };
    const labels: Record<string, string> = {
      available: 'Available',
      on_duty: 'On Duty',
      on_break: 'On Break',
      off_duty: 'Off Duty',
      sick: 'Sick',
      vacation: 'Vacation',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-200 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === 'available' || d.status === 'on_duty').length;
  const avgRating = drivers.length ? (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1) : '0';

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link
                to="/super-admin/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">All Drivers</h1>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">Manage drivers across all organizations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard title="TOTAL DRIVERS" value={totalDrivers} icon={Users} bgColor="bg-blue-800" />
          <StatCard title="ACTIVE DRIVERS" value={activeDrivers} icon={Truck} bgColor="bg-green-800" />
          <StatCard title="AVERAGE RATING" value={`${avgRating} ★`} icon={Star} bgColor="bg-yellow-800" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, license, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="on_duty">On Duty</option>
                <option value="on_break">On Break</option>
                <option value="off_duty">Off Duty</option>
                <option value="sick">Sick</option>
                <option value="vacation">Vacation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Driver</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">License</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Organization</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Deliveries</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Rating</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Phone</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium">No drivers found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-700" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-900">{driver.user?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-600">{driver.user?.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800 font-mono">{driver.licenseNumber}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{driver.organization?.name || 'N/A'}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{getStatusBadge(driver.status)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{driver.totalDeliveries}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-bold text-gray-800">{driver.rating}</span>
                          <span className="text-xs text-gray-500 ml-1">/5</span>
                        </div>
                       </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{driver.phone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {filteredDrivers.length} of {drivers.length} drivers
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDrivers;