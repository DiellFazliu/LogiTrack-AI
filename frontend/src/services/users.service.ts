// src/services/users.service.ts
import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'company_admin' | 'dispatcher' | 'driver' | 'customer';
  organizationId: string | null;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export const usersService = {

  getMe: () => api.get('/users/me'),
  
  updateMe: (data: Partial<User>) => api.patch('/users/me', data),
  
  async getProfile(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  async changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    organizationId?: string;
  }): Promise<UsersResponse> {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async changeRole(id: string, role: string): Promise<User> {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  async toggleStatus(id: string, isActive: boolean): Promise<User> {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getByOrganization(organizationId: string): Promise<User[]> {
    const response = await api.get(`/organizations/${organizationId}/users`);
    return response.data;
  },
};