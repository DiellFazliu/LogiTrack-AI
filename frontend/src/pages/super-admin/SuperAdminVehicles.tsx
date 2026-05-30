import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Truck, Wrench, RefreshCw, CircleDot, Calendar, Fuel } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
      // Get all organizations
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
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      repair: 'bg-orange-100 text-orange-800',
      out_of_service: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      available: 'Available',
      in_use: 'In Use',
      maintenance: 'Maintenance',
      repair: 'Repair',
      out_of_service: 'Out of Service',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="w-4 h-4 text-gray-600" />;
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
                <h1 className="text-3xl font-bold text-gray-800">All Vehicles</h1>
                <p className="text-gray-500 mt-1">Manage fleet across all organizations</p>
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
                placeholder="Search by license plate, brand, model, or organization..."
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
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
                <option value="out_of_service">Out of Service</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Stats Summary */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Truck className="w-5 h-5" />
            <span className="font-medium">Total Vehicles: {filteredVehicles.length}</span>
            <span className="text-gray-400 mx-2">|</span>
            <span>Showing {filteredVehicles.length} of {vehicles.length}</span>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No vehicles found
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {getTypeIcon(vehicle.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.brand} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500">{vehicle.year}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{vehicle.licensePlate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.organization?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize text-sm text-gray-900">{vehicle.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(vehicle.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.capacityKg?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{vehicle.fuelType}</td>
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

export default SuperAdminVehicles;