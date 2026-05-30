// frontend/src/pages/super-admin/UsersList.tsx
import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Shield, UserPlus, Eye, AlertCircle, Users, UserCheck, UserX, Mail, Phone, Calendar, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  organizationId?: string;
  organization_name?: string;
  organization?: { id: string; name: string };
  is_active?: boolean;
  isActive?: boolean;
  phone?: string;
  created_at?: string;
  createdAt?: string;
  last_login?: string;
  lastLogin?: string;
  roles?: any[];
}


// StatCard component
const StatCard = ({ title, value, icon: Icon, bgColor, description }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
        <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
        <p className="text-[10px] text-white/70 mt-1">{description}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

export const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      let usersData = response.data;
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else if (usersData.items) {
        setUsers(usersData.items);
      } else if (usersData.data) {
        setUsers(usersData.data);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view all users');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch users');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to delete this user');
      } else if (error.response?.status === 404) {
        toast.error('User not found');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${id}`, { is_active: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-200 text-purple-800',
      company_admin: 'bg-blue-200 text-blue-800',
      dispatcher: 'bg-green-200 text-green-800',
      driver: 'bg-yellow-200 text-yellow-800',
      customer: 'bg-gray-200 text-gray-800',
    };
    return colors[role] || 'bg-gray-200 text-gray-800';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '👑';
      case 'company_admin':
        return '🏢';
      case 'dispatcher':
        return '📋';
      case 'driver':
        return '🚚';
      case 'customer':
        return '👤';
      default:
        return '👤';
    }
  };

const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(search.toLowerCase());

    // IMPORTANT: GET /users returns `roles` but not `role`.
    // Do NOT default to 'customer' for missing role; that breaks filtering/stats.
    const roleLabel = String(
      (user as any).role ??
        (user as any).roles?.[0]?.name ??
        (user as any).roles?.[0]?.role ??
        ''
    );

    const matchesRole = roleFilter === 'all' || roleLabel === roleFilter;

    const isActive = (user as any).is_active ?? (user as any).isActive;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

const stats = {
    total: users.length,
    superAdmins: users.filter(u => (u.role as any) === 'super_admin').length,
    companyAdmins: users.filter(u => (u.role as any) === 'company_admin').length,
    active: users.filter(u => ((u as any).is_active ?? (u as any).isActive)).length,
    inactive: users.filter(u => !(((u as any).is_active ?? (u as any).isActive))).length,
  };

  const handleCreateUser = () => navigate('/super-admin/users/create');
  const handleEditUser = (userId: string) => navigate(`/super-admin/users/${userId}/edit`);
  const handleViewUser = (userId: string) => navigate(`/super-admin/users/${userId}`);
  const confirmDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
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
                <h1 className="text-2xl font-extrabold text-gray-900">All Users</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Manage system users across all organizations</p>
            </div>
            <button
              onClick={handleCreateUser}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold rounded-lg shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              Create User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <StatCard title="TOTAL USERS" value={stats.total} icon={Users} bgColor="bg-blue-800" description="All users" />
          <StatCard title="SUPER ADMINS" value={stats.superAdmins} icon={Shield} bgColor="bg-purple-800" description="Full system access" />
          <StatCard title="COMPANY ADMINS" value={stats.companyAdmins} icon={Building2} bgColor="bg-indigo-800" description="Organization managers" />
          <StatCard title="ACTIVE" value={stats.active} icon={UserCheck} bgColor="bg-green-800" description="Active accounts" />
          <StatCard title="INACTIVE" value={stats.inactive} icon={UserX} bgColor="bg-red-800" description="Disabled accounts" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="company_admin">Company Admin</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="driver">Driver</option>
              <option value="customer">Customer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">User</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Organization</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Created</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium">No users found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-base">{getRoleIcon(user.role || '')}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{user.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500 font-mono">ID: {user.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <p className="text-sm text-gray-800">{user.email}</p>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-600">{user.phone}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor((user as any).role ?? (user as any).roles?.[0]?.name ?? (user as any).roles?.[0]?.role ?? '')}`}
                        >
                          {String(
                            (user as any).role ?? (user as any).roles?.[0]?.name ?? (user as any).roles?.[0]?.role ?? 'customer'
                          ).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">
{user.organization_name || user.organization?.name || (user as any).organization?.name || '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
onClick={() => toggleUserStatus(user.id, (user as any).is_active ?? (user as any).isActive)}
                          className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
((user as any).is_active ?? (user as any).isActive)
                              ? 'bg-green-200 text-green-800 hover:bg-green-300'
                              : 'bg-red-200 text-red-800 hover:bg-red-300'
                          }`}
                        >
{((user as any).is_active ?? (user as any).isActive) ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-700">
{new Date((user as any).created_at ?? (user as any).createdAt ?? Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewUser(user.id)}
                            className="text-blue-700 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="text-green-700 hover:text-green-900 p-1"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(user)}
                            disabled={deletingId === user.id}
                            className="text-red-700 hover:text-red-900 p-1 disabled:opacity-50"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">User Management</p>
              <p className="text-sm text-blue-700">
                Super Admins have full system access. Company Admins manage their own organizations.
                Dispatchers manage shipments, Drivers deliver shipments, Customers create and track shipments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={() => selectedUser && deleteUser(selectedUser.id)}
        title="Confirm Delete"
        message={`Are you sure you want to delete user "${selectedUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default UsersList;