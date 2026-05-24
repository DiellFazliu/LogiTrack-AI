// src/pages/company/CompanyVehiclesList.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Truck, Wrench, Fuel, Calendar, Search, Filter, AlertCircle, Car, Box, Gauge, Battery, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { VehicleFormModal } from '../../components/forms/VehicleForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

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

export const CompanyVehiclesList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
      const rawVehicles = response.data?.data || (Array.isArray(response.data) ? response.data : []);
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

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Filtra dhe paginim
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = search === '' || 
        vehicle.license_plate.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVehicles.slice(start, start + itemsPerPage);
  }, [filteredVehicles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  // Statistikat
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    inUse: vehicles.filter(v => v.status === 'in_use').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    outOfService: vehicles.filter(v => v.status === 'out_of_service').length,
    totalCapacity: vehicles.reduce((sum, v) => sum + (v.capacity_kg || 0), 0),
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-700 text-white',
      in_use: 'bg-blue-700 text-white',
      maintenance: 'bg-yellow-700 text-white',
      repair: 'bg-red-700 text-white',
      out_of_service: 'bg-gray-700 text-white',
    };
    return colors[status] || 'bg-gray-700 text-white';
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
                <h1 className="text-2xl font-extrabold text-gray-900">Automjetet</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Menaxhimi i flotës së automjeteve</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4" />
              Shto automjet
            </button>
          </div>
        </div>

        {/* Statistikat */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <StatCard title="TOTAL" value={stats.total} icon={Truck} bgColor="bg-blue-800" />
          <StatCard title="TË LIRA" value={stats.available} icon={Car} bgColor="bg-green-800" />
          <StatCard title="NË PËRDORIM" value={stats.inUse} icon={Gauge} bgColor="bg-blue-800" />
          <StatCard title="NË MIRËMBAJTJE" value={stats.maintenance} icon={Wrench} bgColor="bg-yellow-800" />
          <StatCard title="JASHTË SHËRBIMIT" value={stats.outOfService} icon={AlertCircle} bgColor="bg-gray-800" />
          <StatCard title="KAPACITETI TOTAL" value={`${(stats.totalCapacity / 1000).toFixed(0)}t`} icon={Box} bgColor="bg-purple-800" />
        </div>

        {/* Filtrat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Kërko nga targa, marka ose modeli..."
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
                <option value="available">Të lira</option>
                <option value="in_use">Në përdorim</option>
                <option value="maintenance">Mirëmbajtje</option>
                <option value="repair">Riparim</option>
                <option value="out_of_service">Jashtë shërbimit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista e automjeteve (grid kartash) */}
        {paginatedVehicles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nuk u gjet asnjë automjet</h3>
            <p className="text-gray-500">Kliko "Shto automjet" për të shtuar automjetin e parë.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                      {getTypeIcon(vehicle.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{vehicle.brand} {vehicle.model}</h3>
                      <p className="text-sm text-gray-600 font-mono">{vehicle.license_plate}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="text-blue-700 hover:text-blue-900 p-1"
                      title="Edito"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: vehicle.id, name: `${vehicle.brand} ${vehicle.model}` })}
                      className="text-red-700 hover:text-red-900 p-1"
                      title="Fshij"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Viti / Ngjyra:</span>
                    <span className="font-medium text-gray-800">{vehicle.year} / {vehicle.color || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kapaciteti:</span>
                    <span className="font-medium text-gray-800">{vehicle.capacity_kg} kg / {vehicle.capacity_m3} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Karburanti:</span>
                    <span className="flex items-center gap-1 font-medium text-gray-800">
                      <Fuel className="w-3 h-3" /> {vehicle.fuel_type || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kilometrazhi:</span>
                    <span className="font-medium text-gray-800">{vehicle.mileage_km?.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Statusi:</span>
                    <select
                      value={vehicle.status}
                      onChange={(e) => updateVehicleStatus(vehicle.id, e.target.value)}
                      className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase ${getStatusColor(vehicle.status)} border-0 focus:ring-1 focus:ring-blue-500 cursor-pointer`}
                    >
                      <option value="available">I lirë</option>
                      <option value="in_use">Në përdorim</option>
                      <option value="maintenance">Mirëmbajtje</option>
                      <option value="repair">Riparim</option>
                      <option value="out_of_service">Jashtë shërbimit</option>
                    </select>
                  </div>
                  {vehicle.next_maintenance && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 flex items-center gap-1"><Calendar className="w-3 h-3" /> Mirëmbajtja e ardhshme:</span>
                      <span className="font-medium text-gray-800">{new Date(vehicle.next_maintenance).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Paginimi */}
        {filteredVehicles.length > 0 && (
          <div className="mt-5 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Duke shfaqur {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredVehicles.length)} nga {filteredVehicles.length} automjete
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmo fshirjen"
        message={`A jeni i sigurt që doni të fshini automjetin "${deleteTarget?.name}"?`}
        confirmText="Fshij"
        cancelText="Anulo"
        type="danger"
      />

      <VehicleFormModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={fetchVehicles}
        vehicle={editingVehicle}
      />
    </div>
  );
};