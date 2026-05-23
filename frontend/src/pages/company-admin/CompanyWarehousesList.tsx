// frontend/src/pages/company/CompanyWarehousesList.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Warehouse, MapPin, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity_sqm: number;
  manager_name: string;
  manager_phone: string;
  is_active: boolean;
  created_at: string;
}

export const CompanyWarehousesList: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  const deleteWarehouse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;
    
    try {
      await api.delete(`/warehouses/${id}`);
      toast.success('Warehouse deleted successfully');
      fetchWarehouses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete warehouse');
    }
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
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Warehouses</h1>
              <p className="text-gray-500 mt-1">Manage your storage facilities</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" /> Add Warehouse
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {warehouses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Warehouse className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No warehouses found</h3>
            <p className="text-gray-500">Click "Add Warehouse" to create your first warehouse.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Warehouse className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{warehouse.name}</h3>
                      <p className="text-gray-500 text-sm">Created: {new Date(warehouse.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteWarehouse(warehouse.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <span className="text-sm">{warehouse.address}</span>
                  </div>
                  {warehouse.capacity_sqm && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Capacity:</span>
                      <span>{warehouse.capacity_sqm} m²</span>
                    </div>
                  )}
                  {warehouse.manager_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> Manager:
                      </span>
                      <span>{warehouse.manager_name}</span>
                    </div>
                  )}
                  {warehouse.manager_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Contact:
                      </span>
                      <span>{warehouse.manager_phone}</span>
                    </div>
                  )}
                  {warehouse.latitude && warehouse.longitude && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Coordinates:</span>
                      <span className="text-sm">{warehouse.latitude}, {warehouse.longitude}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      warehouse.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {warehouse.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Add New Warehouse</h2>
            <p className="text-gray-500 mb-4">Warehouse creation form would go here</p>
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

export default CompanyWarehousesList;