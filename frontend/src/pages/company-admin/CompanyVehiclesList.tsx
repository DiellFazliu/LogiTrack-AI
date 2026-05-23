import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck, Wrench, Fuel, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { VehicleFormModal } from '../../components/formModal/VehicleFormModal';

interface Vehicle {
  id: string;
  license_plate: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  capacity_kg: number;
  capacity_m3: number;
  fuel_type: string;
  status: string;
  mileage_km: number;
  last_maintenance: string;
  next_maintenance: string;
  insurance_expiry: string;
  registration_expiry: string;
}

export const CompanyVehiclesList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const transformKeysToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => transformKeysToSnakeCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = toSnakeCase(key);
      acc[snakeKey] = transformKeysToSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const fetchVehicles = async () => {
  try {
    const response = await api.get('/vehicles');
    // Extract the data array (paginated response)
    const rawVehicles = response.data?.data || (Array.isArray(response.data) ? response.data : []);
    // Transform to snake_case
    const vehiclesSnake = transformKeysToSnakeCase(rawVehicles);
    setVehicles(vehiclesSnake);
  } catch (error: any) {
    console.error('Error:', error);
    toast.error(error.response?.data?.message || 'Failed to fetch vehicles');
  } finally {
    setLoading(false);
  }
};

  const deleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const updateVehicleStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/vehicles/${id}/status`, { status });
      toast.success('Vehicle status updated');
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingVehicle(undefined);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      repair: 'bg-red-100 text-red-800',
      out_of_service: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      truck: '🚛',
      van: '🚐',
      motorcycle: '🏍️',
      car: '🚗',
      trailer: '🚛',
    };
    return icons[type] || '🚚';
  };

  const filteredVehicles = vehicles.filter(v => statusFilter === 'all' || v.status === statusFilter);

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Vehicles</h1>
              <p className="text-gray-500 mt-1">Manage your fleet</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="repair">Repair</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No vehicles found</h3>
            <p className="text-gray-500">Click "Add Vehicle" to add your first vehicle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full text-2xl">
                      {getTypeIcon(vehicle.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{vehicle.brand} {vehicle.model}</h3>
                      <p className="text-gray-500 text-sm">{vehicle.license_plate}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(vehicle)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteVehicle(vehicle.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Year/Color:</span>
                    <span>{vehicle.year} / {vehicle.color || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capacity:</span>
                    <span>{vehicle.capacity_kg} kg / {vehicle.capacity_m3} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fuel:</span>
                    <span className="flex items-center gap-1"><Fuel className="w-3 h-3" /> {vehicle.fuel_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mileage:</span>
                    <span>{vehicle.mileage_km?.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <select
                      value={vehicle.status}
                      onChange={(e) => updateVehicleStatus(vehicle.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(vehicle.status)} border-0 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="repair">Repair</option>
                      <option value="out_of_service">Out of Service</option>
                    </select>
                  </div>
                  {vehicle.next_maintenance && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Next Maintenance:</span>
                      <span className="text-sm">{new Date(vehicle.next_maintenance).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <VehicleFormModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={fetchVehicles}
        vehicle={editingVehicle}
      />
    </div>
  );
};

export default CompanyVehiclesList;