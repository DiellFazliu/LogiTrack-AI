import { useEffect, useMemo, useState } from 'react';
import { useUsers, useDeleteUser, useToggleUserStatus } from '../../hooks/useUsers';
import { DataTable } from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { SearchFilter } from '../../components/common/SearchFilter';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { UserFormModal } from '../../components/forms/UserForm';
import type { User } from '../../services/users.service';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Radio,
  Truck,
  User as UserIcon,
  Calendar,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Kolonat e tabelës me kontrast të lartë
const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Emri',
    render: (value: string, item: User) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold shadow">
          {value.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-600">ID: {item.id.slice(0, 8)}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-900">{value}</span>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Roli',
    render: (value: string) => {
      const roleConfig: Record<
        string,
        { icon: typeof Shield; color: string; label: string }
      > = {
        company_admin: { icon: Shield, color: 'bg-indigo-700 text-white', label: 'Admin' },
        dispatcher: { icon: Radio, color: 'bg-purple-700 text-white', label: 'Dispecer' },
        driver: { icon: Truck, color: 'bg-amber-700 text-white', label: 'Shofer' },
        customer: { icon: UserIcon, color: 'bg-gray-700 text-white', label: 'Klient' },
      };

      const config = roleConfig[value] ?? roleConfig.customer;
      const Icon = config.icon;

      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${config.color}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      );
    },
  },
  {
    key: 'phone',
    header: 'Telefoni',
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Phone className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-900">{value || '—'}</span>
      </div>
    ),
  },
  {
    key: 'isActive',
    header: 'Statusi',
    render: (value: boolean) => (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-600' : 'bg-red-600'}`} />
        <span className={`text-sm font-bold ${value ? 'text-green-800' : 'text-red-800'}`}>
          {value ? 'AKTIV' : 'JOAKTIV'}
        </span>
      </div>
    ),
  },
  {
    key: 'createdAt',
    header: 'Regjistruar',
    render: (date: string) => (
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-900">{new Date(date).toLocaleDateString('sq-AL')}</span>
      </div>
    ),
  },
];

// Komponenti i kartës statistikore me kontrast të lartë
const StatCard = ({
  title,
  value,
  icon: Icon,
  bgColor,
}: {
  title: string;
  value: number;
  icon: any;
  bgColor: string;
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bgColor} rounded-xl shadow-lg p-4 border border-black/10`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-white/90">{title}</p>
        <p className="text-3xl font-extrabold mt-1 text-white">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

const normalizeRole = (u: User) => {
  const anyU = u as any;
  return (
    anyU?.role ??
    anyU?.roles?.[0]?.name ??
    anyU?.roles?.[0]?.role ??
    anyU?.user_roles?.[0]?.name ??
    anyU?.user_roles?.[0]?.role ??
    'customer'
  );
};

export const CompanyUsersList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data, isLoading, error } = useUsers({
    // Backend aktualisht kthen të gjithë users për organizatën.
    // Pra search + role + status bëhen client-side.
    page,
    search,
    role: roleFilter === 'all' ? undefined : roleFilter,
  });

  const deleteUser = useDeleteUser();
  const toggleStatus = useToggleUserStatus();

  const usersArray: User[] = useMemo(() => {
    const raw = data as any;
    return Array.isArray(raw) ? raw : (raw?.data as User[]) || [];
  }, [data]);

  const normalizedAllUsers = useMemo(() => {
    return usersArray.map((u) => ({
      ...u,
      role: normalizeRole(u),
    }));
  }, [usersArray]);

  const normalizedUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return normalizedAllUsers.filter((u) => {
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' ? true : (u as any).role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ? true : statusFilter === 'active' ? u.isActive : !u.isActive;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [normalizedAllUsers, search, roleFilter, statusFilter]);

  const limit = 10;
  const totalItems = normalizedUsers.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const pagedUsers = useMemo(() => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    return normalizedUsers.slice((safePage - 1) * limit, safePage * limit);
  }, [normalizedUsers, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: normalizedUsers.length,
      active: normalizedUsers.filter((u) => u.isActive).length,
      inactive: normalizedUsers.filter((u) => !u.isActive).length,
      admins: normalizedUsers.filter((u) => (u as any).role === 'company_admin').length,
      dispatchers: normalizedUsers.filter((u) => (u as any).role === 'dispatcher').length,
      drivers: normalizedUsers.filter((u) => (u as any).role === 'driver').length,
      customers: normalizedUsers.filter((u) => (u as any).role === 'customer').length,
    };
  }, [normalizedUsers]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowCreateModal(true);
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (error)
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-300">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gabim në ngarkim</h3>
          <p className="text-gray-700 mb-4">Nuk mund të ngarkohen të dhënat e përdoruesve.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition"
          >
            Provo përsëri
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-8 bg-blue-700 rounded-full" />
                <h1 className="text-3xl font-extrabold text-gray-900">Përdoruesit</h1>
              </div>
              <p className="text-sm text-gray-700 pl-3">Menaxhimi i të gjithë përdoruesve të kompanisë</p>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setShowCreateModal(true);
              }}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              Shto përdorues
            </button>
          </div>
        </div>

        {/* Statistikat me ngjyra të forta */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <StatCard title="TOTAL" value={stats.total} icon={Users} bgColor="bg-blue-800" />
          <StatCard title="AKTIVË" value={stats.active} icon={UserCheck} bgColor="bg-green-800" />
          <StatCard title="JOAKTIVË" value={stats.inactive} icon={UserX} bgColor="bg-red-800" />
          <StatCard title="ADMIN" value={stats.admins} icon={Shield} bgColor="bg-indigo-800" />
          <StatCard title="DISPEÇERË" value={stats.dispatchers} icon={Radio} bgColor="bg-purple-800" />
          <StatCard title="SHOFERË" value={stats.drivers} icon={Truck} bgColor="bg-amber-800" />
          <StatCard title="KLIENTË" value={stats.customers} icon={UserIcon} bgColor="bg-gray-800" />
        </div>

        {/* Panel filtrimi */}
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchFilter
                onSearch={setSearch}
                placeholder="Kërko përdorues sipas emrit, emailit ose telefonit..."
              />
            </div>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Të gjithë rolet</option>
                <option value="company_admin">Admin</option>
                <option value="dispatcher">Dispecer</option>
                <option value="driver">Shofer</option>
                <option value="customer">Klient</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Të gjithë statuset</option>
                <option value="active">Aktivë</option>
                <option value="inactive">Joaktivë</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
          <DataTable
            columns={columns}
            data={pagedUsers as any}
            onDelete={(user) => setDeleteTarget({ id: user.id, name: user.name })}
            onEdit={handleEdit}
            extraActions={(user) => (
              <button
                onClick={() => toggleStatus.mutate({ id: user.id, isActive: !user.isActive })}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                  user.isActive
                    ? 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                    : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                }`}
              >
                {user.isActive ? 'Çaktivizo' : 'Aktivizo'}
              </button>
            )}
          />
        </div>

        {/* Paginimi */}
        {totalItems > 0 && (
          <div className="mt-6">
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

      {/* Dialogu i konfirmimit */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Konfirmo fshirjen"
        message={`A jeni i sigurt që doni të fshini përdoruesin "${deleteTarget?.name}"?`}
        confirmText="Fshij"
        cancelText="Anulo"
        type="danger"
      />

      {/* Modal */}
      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
        }}
        onSuccess={() => {
          setShowCreateModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />
    </div>
  );
};

