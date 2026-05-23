import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck, Phone, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      // Përdor endpoint-in e saktë: GET /drivers
      const response = await api.get('/drivers');
      setDrivers(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        toast.error('Unauthorized. Please login again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch drivers');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteDriver = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    
    try {
      await api.delete(`/drivers/${id}`);
      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete driver');
    }
  };

  const updateDriverStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/drivers/${id}/status`, { status });
      toast.success('Driver status updated');
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      on_duty: 'bg-blue-100 text-blue-800',
      on_break: 'bg-yellow-100 text-yellow-800',
      off_duty: 'bg-gray-100 text-gray-800',
      sick: 'bg-red-100 text-red-800',
      vacation: 'bg-purple-100 text-purple-800',
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
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
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
                    <button 
                      onClick={() => deleteDriver(driver.id)}
                      className="text-red-600 hover:text-red-800"
                    >
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
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <select
                      value={driver.status}
                      onChange={(e) => updateDriverStatus(driver.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(driver.status)} border-0 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="available">Available</option>
                      <option value="on_duty">On Duty</option>
                      <option value="on_break">On Break</option>
                      <option value="off_duty">Off Duty</option>
                      <option value="sick">Sick</option>
                      <option value="vacation">Vacation</option>
                    </select>
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

      {/* Create Driver Modal - Simplified */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Add New Driver</h2>
            <p className="text-gray-500 mb-4">Driver creation form would go here</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversList;