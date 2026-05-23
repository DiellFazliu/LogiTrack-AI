import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, User, Phone, Mail, AlertCircle, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
      // Get all organizations first
      const orgsRes = await api.get('/organizations');
      const organizations = orgsRes.data || [];

      // Fetch drivers from each organization
      let allDrivers: Driver[] = [];
      for (const org of organizations) {
        try {
          const driversRes = await api.get(`/organizations/${org.id}/drivers`);
          const orgDrivers = driversRes.data || [];
          // Attach organization info to each driver
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
      available: 'bg-green-100 text-green-800',
      on_duty: 'bg-blue-100 text-blue-800',
      on_break: 'bg-yellow-100 text-yellow-800',
      off_duty: 'bg-gray-100 text-gray-800',
      sick: 'bg-red-100 text-red-800',
      vacation: 'bg-purple-100 text-purple-800',
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link to="/super-admin/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">All Drivers</h1>
                <p className="text-gray-500 mt-1">Manage drivers across all organizations</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, license, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Stats Summary */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span className="font-medium">Total Drivers: {filteredDrivers.length}</span>
            <span className="text-gray-400 mx-2">|</span>
            <span>Showing {filteredDrivers.length} of {drivers.length}</span>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliveries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No drivers found
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{driver.user?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{driver.user?.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.licenseNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.organization?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(driver.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.totalDeliveries}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{driver.rating}</span>
                          <span className="text-xs text-gray-500 ml-1">/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.phone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDrivers;