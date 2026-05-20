import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck, Phone, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api'; // Përdor axios-in e konfiguruar

interface Driver {
  id: string;
  name: string;
  email: string;
  license_number: string;
  phone: string;
  status: string;
  rating: number;
  total_deliveries: number;
  hire_date: string;
}

export const DriversList: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token); // Debug
      
      if (!token) {
        toast.error('No authentication token found');
        setLoading(false);
        return;
      }

      console.log('Fetching drivers from API...'); // Debug
      const response = await api.get('drivers');
      
      console.log('Response status:', response.status); // Debug
      console.log('Response data:', response.data); // Debug
      
      if (response.data) {
        setDrivers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Detailed error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 401) {
        toast.error('Unauthorized. Please login again.');
      } else if (error.response?.status === 404) {
        toast.error('Drivers endpoint not found. Please check API route.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to fetch drivers. Check if backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      on_duty: 'bg-blue-100 text-blue-800',
      on_break: 'bg-yellow-100 text-yellow-800',
      off_duty: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Drivers</h1>
              <p className="text-gray-500 mt-1">Manage your delivery drivers</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600">
              <Plus className="w-4 h-4" /> Add Driver
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {drivers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No drivers found</h3>
            <p className="text-gray-500">Click "Add Driver" to create your first driver.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{driver.name}</h3>
                      <p className="text-gray-500 text-sm">{driver.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">License:</span>
                    <span className="font-medium">{driver.license_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {driver.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(driver.status)}`}>
                      {driver.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating:</span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" /> {driver.rating}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deliveries:</span>
                    <span>{driver.total_deliveries}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriversList;