// src/pages/company/CompanyWarehousesList.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Warehouse, MapPin, User, Phone, Search, Building2, Package, Users, AlertCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { WarehouseFormModal } from '../../components/forms/WarehouseForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

// ✅ Përditëso interface me camelCase (siç vjen nga backend)
interface Warehouse {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  capacitySqm?: number;     // ✅ ndrysho nga capacity_sqm
  managerName?: string;      // ✅ ndrysho nga manager_name
  managerPhone?: string;     // ✅ ndrysho nga manager_phone
  isActive: boolean;         // ✅ ndrysho nga is_active
  createdAt: string;         // ✅ ndrysho nga created_at
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

export const CompanyWarehousesList: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      console.log('Raw response:', response.data);
      
      // Përdor të dhënat direkt pa transformim
      if (Array.isArray(response.data)) {
        setWarehouses(response.data);
      } else {
        setWarehouses([]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  const deleteWarehouse = async (id: string) => {
    try {
      await api.delete(`/warehouses/${id}`);
      toast.success('Warehouse deleted successfully');
      fetchWarehouses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete warehouse');
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingWarehouse(undefined);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteWarehouse(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Filtrimi dhe paginimi - përdor camelCase
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(wh => 
      search === '' || 
      wh.name.toLowerCase().includes(search.toLowerCase()) ||
      wh.address.toLowerCase().includes(search.toLowerCase()) ||
      (wh.managerName && wh.managerName.toLowerCase().includes(search.toLowerCase()))
    );
  }, [warehouses, search]);

  const paginatedWarehouses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWarehouses.slice(start, start + itemsPerPage);
  }, [filteredWarehouses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);

  // Statistikat - përdor camelCase
  const stats = {
    total: warehouses.length,
    totalCapacity: warehouses.reduce((sum, wh) => sum + (wh.capacitySqm || 0), 0),
    withManager: warehouses.filter(wh => wh.managerName).length,
    active: warehouses.filter(wh => wh.isActive).length,
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
                <h1 className="text-2xl font-extrabold text-gray-900">Depot</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Menaxhimi i depove dhe magazinave</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4" />
              Shto depo
            </button>
          </div>
        </div>

        {/* Statistikat */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard title="TOTAL DEPO" value={stats.total} icon={Warehouse} bgColor="bg-blue-800" />
          <StatCard title="KAPACITETI TOTAL" value={`${(stats.totalCapacity / 1000).toFixed(0)}k m²`} icon={Package} bgColor="bg-green-800" />
          <StatCard title="MENAXHERË" value={stats.withManager} icon={Users} bgColor="bg-purple-800" />
          <StatCard title="AKTIVE" value={stats.active} icon={Building2} bgColor="bg-yellow-800" />
        </div>

        {/* Kërkimi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Kërko depo sipas emrit, adresës ose menaxherit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Lista e depove (grid kartash) */}
        {paginatedWarehouses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nuk u gjet asnjë depo</h3>
            <p className="text-gray-500">Kliko "Shto depo" për të krijuar depon e parë.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedWarehouses.map((warehouse) => (
              <motion.div
                key={warehouse.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{warehouse.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {warehouse.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(warehouse)}
                      className="text-blue-700 hover:text-blue-900 p-1"
                      title="Edito"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: warehouse.id, name: warehouse.name })}
                      className="text-red-700 hover:text-red-900 p-1"
                      title="Fshij"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {warehouse.capacitySqm && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kapaciteti:</span>
                      <span className="font-medium text-gray-800">{warehouse.capacitySqm} m²</span>
                    </div>
                  )}
                  {(warehouse.latitude || warehouse.longitude) && (
  <div className="flex justify-between">
    <span className="text-gray-600">Koordinatat:</span>
    <span className="font-medium text-gray-800">
      {typeof warehouse.latitude === 'number' ? warehouse.latitude.toFixed(4) : warehouse.latitude} , 
      {typeof warehouse.longitude === 'number' ? warehouse.longitude.toFixed(4) : warehouse.longitude}
    </span>
  </div>
)}
                  {warehouse.managerName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1"><User className="w-3 h-3" /> Menaxheri:</span>
                      <span className="font-medium text-gray-800">{warehouse.managerName}</span>
                    </div>
                  )}
                  {warehouse.managerPhone && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" /> Tel:</span>
                      <span className="font-medium text-gray-800">{warehouse.managerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <span className="text-gray-600">Statusi:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase ${warehouse.isActive ? 'bg-green-700 text-white' : 'bg-gray-700 text-white'}`}>
                      {warehouse.isActive ? 'Aktive' : 'Joaktive'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Paginimi */}
        {filteredWarehouses.length > 0 && (
          <div className="mt-5 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Duke shfaqur {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredWarehouses.length)} nga {filteredWarehouses.length} depo
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
        message={`A jeni i sigurt që doni të fshini depon "${deleteTarget?.name}"?`}
        confirmText="Fshij"
        cancelText="Anulo"
        type="danger"
      />

      <WarehouseFormModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={fetchWarehouses}
        warehouse={editingWarehouse}
      />
    </div>
  );
};

export default CompanyWarehousesList;