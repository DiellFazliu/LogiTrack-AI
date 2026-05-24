// src/pages/company/CompanyDriversList.tsx
import { useState } from 'react';
import { useDrivers, useDeleteDriver, useUpdateDriverStatus } from '../../hooks/useDrivers';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { SearchFilter } from '../../components/common/SearchFilter';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DriverFormModal } from '../../components/forms/DriverForm';
import type { Driver } from '../../services/drivers.service';
import { Users, UserPlus, Truck, Phone, Award, AlertCircle, Activity, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

// Kolona të optimizuara për të kursyer hapësirë horizontale
const columns: Column<Driver>[] = [
  {
    key: 'user',
    header: 'Emri',
    render: (_, item) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
          {item.user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span className="font-medium text-gray-900 truncate max-w-[100px]">
          {item.user?.name || 'N/A'}
        </span>
      </div>
    ),
  },
  {
    key: 'user',
    header: 'Email',
    render: (_, item) => (
      <span className="text-sm text-gray-900 truncate max-w-[140px] block">
        {item.user?.email || 'N/A'}
      </span>
    ),
  },
  {
    key: 'licenseNumber',
    header: 'Licenca',
    render: (value) => (
      <span className="font-mono text-sm text-gray-900 truncate max-w-[90px] block">
        {value || '—'}
      </span>
    ),
  },
  {
    key: 'phone',
    header: 'Telefoni',
    render: (value) => (
      <span className="text-sm text-gray-900 truncate max-w-[100px] block">
        {value || '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Statusi',
    render: (status: string) => {
      const colors: Record<string, string> = {
        available: 'bg-green-700',
        on_duty: 'bg-blue-700',
        on_break: 'bg-yellow-700',
        off_duty: 'bg-gray-700',
        sick: 'bg-red-700',
        vacation: 'bg-purple-700',
      };
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase text-white ${colors[status] || 'bg-gray-700'}`}>
          {status === 'available' ? 'Lirë' : status === 'on_duty' ? 'Në detyrë' : status.replace('_', ' ').slice(0, 6)}
        </span>
      );
    },
  },
  {
    key: 'totalDeliveries',
    header: 'Dërgesa',
    render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
  },
  {
    key: 'rating',
    header: 'Vlerësimi',
    render: (rating) => (
      <div className="flex items-center gap-0.5">
        <Award className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" />
        <span className="font-semibold text-gray-900 text-sm">{rating}</span>
      </div>
    ),
  },
];

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

export const CompanyDriversList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const { data, isLoading, error } = useDrivers({ page, search, status: statusFilter });
  const deleteDriver = useDeleteDriver();
  const updateStatus = useUpdateDriverStatus();

  const driversArray = data?.data || [];
  const totalItems = data?.total || 0;
  const limit = data?.limit || 10;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const stats = {
    total: driversArray.length,
    active: driversArray.filter((d: Driver) => d.status === 'available').length,
    onDuty: driversArray.filter((d: Driver) => d.status === 'on_duty').length,
    totalDeliveries: driversArray.reduce((sum: number, d: Driver) => sum + (d.totalDeliveries || 0), 0),
    avgRating: driversArray.length 
      ? (driversArray.reduce((sum: number, d: Driver) => sum + (d.rating || 0), 0) / driversArray.length).toFixed(1)
      : 0,
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteDriver.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setShowCreateModal(true);
  };

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-sm p-6 bg-white rounded-xl shadow border border-gray-200">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-800">Gabim në ngarkim</h3>
        <p className="text-gray-600 text-sm mb-4">Nuk mund të ngarkohen të dhënat e shoferëve.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">
          Provo përsëri
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Shoferët</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Menaxhimi i shoferëve të kompanisë</p>
            </div>
            <button
              onClick={() => { setEditingDriver(null); setShowCreateModal(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              Shto shofer
            </button>
          </div>
        </div>

        {/* Statistikat - grid i ngjeshur */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          <StatCard title="TOTAL" value={stats.total} icon={Users} bgColor="bg-blue-800" />
          <StatCard title="TË LIRË" value={stats.active} icon={Truck} bgColor="bg-green-800" />
          <StatCard title="NË DETYRË" value={stats.onDuty} icon={Activity} bgColor="bg-yellow-800" />
          <StatCard title="DËRGESA" value={stats.totalDeliveries} icon={Award} bgColor="bg-purple-800" />
          <StatCard title="VLERËSIMI" value={stats.avgRating} icon={Award} bgColor="bg-amber-800" />
        </div>

        {/* Filtrat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchFilter onSearch={setSearch} placeholder="Kërko shofer..." />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-8 pr-6 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Të gjithë</option>
                  <option value="available">I lirë</option>
                  <option value="on_duty">Në detyrë</option>
                  <option value="on_break">Pushim</option>
                  <option value="off_duty">Jo në detyrë</option>
                  <option value="sick">I sëmurë</option>
                  <option value="vacation">Pushim</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela - tani përshtatet në ekran */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <DataTable
            columns={columns}
            data={driversArray}
            onDelete={(driver) => setDeleteTarget({ id: driver.id, name: driver.user?.name || 'Shofer' })}
            onEdit={handleEdit}
            extraActions={(driver) => (
              <button
                onClick={() => updateStatus.mutate({ id: driver.id, status: driver.status === 'available' ? 'on_duty' : 'available' })}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                  driver.status === 'available'
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                {driver.status === 'available' ? 'Nis' : 'Liro'}
              </button>
            )}
          />
        </div>

        {/* Paginimi */}
        {driversArray.length > 0 && (
          <div className="mt-5">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={limit}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Konfirmo fshirjen"
        message={`A jeni i sigurt që doni të fshini shoferin "${deleteTarget?.name}"?`}
        confirmText="Fshij"
        cancelText="Anulo"
        type="danger"
      />

      <DriverFormModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingDriver(null); }}
        onSuccess={() => { setShowCreateModal(false); setEditingDriver(null); }}
        driver={editingDriver}
      />
    </div>
  );
};