// frontend/src/pages/super-admin/UsersList.tsx
import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Shield, UserPlus, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organization_id: string;
  organization_name?: string;
  organization?: { id: string; name: string };
  is_active: boolean;
  phone?: string;
  created_at: string;
  last_login?: string;
}

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
      // Përdor endpoint-in e saktë që ekziston
      const response = await api.get('/users');
      let usersData = response.data;
      
      // Nëse response është array, përdor drejtpërsëdrejti
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } 
      // Nëse response ka property 'items' ose 'data'
      else if (usersData.items) {
        setUsers(usersData.items);
      }
      else if (usersData.data) {
        setUsers(usersData.data);
      }
      else {
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
      super_admin: 'bg-purple-100 text-purple-800',
      company_admin: 'bg-blue-100 text-blue-800',
      dispatcher: 'bg-green-100 text-green-800',
      driver: 'bg-yellow-100 text-yellow-800',
      customer: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
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
    const matchesSearch = (user.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
                         (user.email?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    navigate('/super-admin/users/create');
  };

  const handleEditUser = (userId: string) => {
    navigate(`/super-admin/users/${userId}/edit`);
  };

  const handleViewUser = (userId: string) => {
    navigate(`/super-admin/users/${userId}`);
  };

  const confirmDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">All Users</h1>
              <p className="text-gray-500 mt-1">Manage system users across all organizations</p>
            </div>
            <button 
              onClick={handleCreateUser}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-600 transition"
            >
              <UserPlus className="w-4 h-4" /> Create User
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="company_admin">Company Admin</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="driver">Driver</option>
              <option value="customer">Customer</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'super_admin').length}</p>
            <p className="text-xs text-gray-500">Super Admins</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'company_admin').length}</p>
            <p className="text-xs text-gray-500">Company Admins</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.is_active).length}</p>
            <p className="text-xs text-gray-500">Inactive</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">{getRoleIcon(user.role)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}</div>
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{user.email}</p>
                          {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                          {user.role?.replace('_', ' ')}
                        </span>
                       </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {user.organization_name || user.organization?.name || '—'}
                        </span>
                       </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } transition`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </button>
                       </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewUser(user.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditUser(user.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => confirmDelete(user)}
                            disabled={deletingId === user.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Footer */}
          <div className="px-6 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Confirm Delete</h2>
            </div>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete user <span className="font-semibold">{selectedUser.name}</span>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action cannot be undone. All data associated with this user will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(selectedUser.id)}
                disabled={deletingId === selectedUser.id}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {deletingId === selectedUser.id ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;