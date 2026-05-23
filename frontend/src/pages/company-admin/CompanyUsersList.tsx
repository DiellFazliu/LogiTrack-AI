// frontend/src/pages/company/CompanyUsersList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Edit, Trash2, UserPlus, Search, Mail, Phone, Users, 
  RefreshCw, X, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CompanyUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}

export const CompanyUsersList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const usersData = response.data;

      let rawList: any[] = [];
      if (Array.isArray(usersData)) rawList = usersData;
      else if (usersData?.items) rawList = usersData.items;
      else if (usersData?.data) rawList = usersData.data;

      // Normalize backend shape -> UI shape so role/status filters work.
      const list: CompanyUser[] = rawList
        .map((u: any): CompanyUser => {
          const orgId = u?.organizationId ?? u?.organization_id;

          const roles = u?.roles;
          const roleName: string | undefined = Array.isArray(roles)
            ? roles[0]?.name ?? roles[0]?.role?.name
            : undefined;

          return {
            id: String(u.id),
            email: u.email,
            name: u.name,
            role: roleName ?? u.role ?? '',
            phone: u.phone ?? '',
            is_active: u.is_active ?? u.isActive ?? true,
            created_at: u.created_at ?? (u.createdAt ? new Date(u.createdAt).toISOString() : ''),
            last_login: u.last_login ?? (u.lastLogin ? new Date(u.lastLogin).toISOString() : undefined),
          };
        })
        .filter((u) => u.id);

      // ✅ Company admin should only see users belonging to their organization.
      // Keep this as a safety-net, but now we normalize org id keys reliably.
      const myOrgId = (currentUser as any)?.organizationId;
      const finalList = myOrgId
        ? list.filter((u: any, _idx: number) => {
            // We need orgId for each raw user; remap it here using rawList.
            // Find matching raw user by id.
            const raw = rawList.find((x: any) => String(x?.id) === String(u.id));
            const rawOrgId = raw?.organizationId ?? raw?.organization_id;
            return rawOrgId ? String(rawOrgId) === String(myOrgId) : false;
          })
        : list;

      setUsers(finalList);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (search) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone?.includes(search)
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }
    
    setFilteredUsers(filtered);
  };

  // ✅ Përdor endpoint-in /auth/users për të krijuar përdorues
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await api.post('/auth/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
      });
      
      if (response.data) {
        toast.success('User created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      // IMPORTANT: backend User entity uses relations for roles.
      // Sending `role: string` likely does nothing / can fail.
      // Our update endpoint expects Partial<User>, but roles updates are not implemented here.
      // So we update only fields that actually exist as columns: name/email/phone.
      await api.put(`/users/${selectedUser.id}`, {
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone,
      });

      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setUpdatingId(id);
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      await api.patch(`/users/${id}`, { is_active: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'customer',
      phone: '',
    });
  };

  const openEditModal = (user: CompanyUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      dispatcher: 'bg-green-100 text-green-800',
      driver: 'bg-yellow-100 text-yellow-800',
      customer: 'bg-gray-100 text-gray-800',
      company_admin: 'bg-blue-100 text-blue-800',
      super_admin: 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'company_admin':
        return '👑';
      case 'super_admin':
        return '⚡';
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

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    admins: users.filter(u => u.role === 'company_admin').length,
    dispatchers: users.filter(u => u.role === 'dispatcher').length,
    drivers: users.filter(u => u.role === 'driver').length,
    customers: users.filter(u => u.role === 'customer').length,
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
              <h1 className="text-3xl font-bold text-gray-800">Team Members</h1>
              <p className="text-gray-500 mt-1">Manage your company users and their roles</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition"
            >
              <UserPlus className="w-4 h-4" /> Invite User
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold text-red-600">{stats.inactive}</p>
            <p className="text-xs text-gray-500">Inactive</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.admins}</p>
            <p className="text-xs text-gray-500">Admins</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold text-green-600">{stats.dispatchers}</p>
            <p className="text-xs text-gray-500">Dispatchers</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold text-yellow-600">{stats.drivers}</p>
            <p className="text-xs text-gray-500">Drivers</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold text-gray-600">{stats.customers}</p>
            <p className="text-xs text-gray-500">Customers</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="company_admin">Company Admin</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="driver">Driver</option>
              <option value="customer">Customer</option>
            </select>

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

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your filters or invite a new user</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit User"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.id !== currentUser?.id && (
                      <button 
                        onClick={() => deleteUser(user.id)}
                        disabled={updatingId === user.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Role:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </div>
                  {user.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Phone:
                      </span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      disabled={updatingId === user.id}
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition disabled:opacity-50`}
                    >
                      {updatingId === user.id ? '...' : (user.is_active ? 'Active' : 'Inactive')}
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Joined:</span>
                    <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  {user.last_login && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Login:</span>
                      <span className="text-sm">{new Date(user.last_login).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Invite New User</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="•••••••• (min. 6 characters)"
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                  <option value="dispatcher">Dispatcher</option>
                </select>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-blue-600">
                    The user will receive their login credentials via email.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={updateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="company_admin">Company Admin</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyUsersList;