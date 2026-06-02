// frontend/src/pages/super-admin/SuperAdminVehicles.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Truck, Wrench, RefreshCw, CircleDot, Calendar, Fuel, Car, Package, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  status: string;
  capacityKg: number;
  fuelType: string;
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

export const SuperAdminVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const orgsRes = await api.get('/organizations');
      const organizations = orgsRes.data || [];

      let allVehicles: Vehicle[] = [];
      for (const org of organizations) {
        try {
          const vehiclesRes = await api.get(`/organizations/${org.id}/vehicles`);
          const orgVehicles = vehiclesRes.data || [];
          const vehiclesWithOrg = orgVehicles.map((v: any) => ({
            ...v,
            organization: { id: org.id, name: org.name },
          }));
          allVehicles = [...allVehicles, ...vehiclesWithOrg];
        } catch (e) {
          console.log(`Could not fetch vehicles for org ${org.id}`);
        }
      }

      setVehicles(allVehicles);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
    toast.success('Vehicles list refreshed');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: 'bg-green-200 text-green-800',
      in_use: 'bg-blue-200 text-blue-800',
      maintenance: 'bg-yellow-200 text-yellow-800',
      repair: 'bg-orange-200 text-orange-800',
      out_of_service: 'bg-red-200 text-red-800',
    };
    const labels: Record<string, string> = {
      available: 'Available',
      in_use: 'In Use',
      maintenance: 'Maintenance',
      repair: 'Repair',
      out_of_service: 'Out of Service',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-200 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="w-4 h-4 text-gray-600" />;
      case 'van':
        return <Package className="w-4 h-4 text-gray-600" />;
      case 'car':
        return <Car className="w-4 h-4 text-gray-600" />;
      default:
        return <CircleDot className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      searchTerm === '' ||
      vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const inUseVehicles = vehicles.filter(v => v.status === 'in_use').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance' || v.status === 'repair').length;

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
                <h1 className="text-2xl font-extrabold text-gray-900">All Vehicles</h1>
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
          <p className="text-sm text-gray-600 pl-3 mt-1">Manage fleet across all organizations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard title="TOTAL VEHICLES" value={totalVehicles} icon={Truck} bgColor="bg-blue-800" />
          <StatCard title="AVAILABLE" value={availableVehicles} icon={Car} bgColor="bg-green-800" />
          <StatCard title="IN USE" value={inUseVehicles} icon={Truck} bgColor="bg-yellow-800" />
          <StatCard title="MAINTENANCE / REPAIR" value={maintenanceVehicles} icon={Wrench} bgColor="bg-red-800" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by license plate, brand, model, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="out_of_service">Out of Service</option>
                </select>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="trailer">Trailer</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Vehicle</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">License Plate</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Organization</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Capacity (kg)</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fuel</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium">No vehicles found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            {getTypeIcon(vehicle.type)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-900">
                              {vehicle.brand} {vehicle.model}
                            </div>
                            <div className="text-xs text-gray-600">{vehicle.year}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">{vehicle.licensePlate}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{vehicle.organization?.name || 'N/A'}</td>
                      <td className="px-5 py-4 whitespace-nowrap capitalize text-sm text-gray-800">{vehicle.type}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{getStatusBadge(vehicle.status)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{vehicle.capacityKg?.toLocaleString()}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800 capitalize">{vehicle.fuelType}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Fleet Overview</p>
              <p className="text-sm text-blue-700">
                This view aggregates vehicles from all organizations. Use filters to narrow down results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminVehicles;