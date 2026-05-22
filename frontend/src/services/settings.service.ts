// src/services/settings.service.ts
import api from './api';

export interface Setting {
  id: string;
  organizationId: string | null;
  key: string;
  value: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  isPublic: boolean;
  group: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingDto {
  key: string;
  value: any;
  dataType?: string;
  description?: string;
  isPublic?: boolean;
  group?: string;
  organizationId?: string;
}

export interface UpdateSettingDto {
  value?: any;
  description?: string;
  isPublic?: boolean;
}

export const settingsService = {
  // Merr të gjitha cilësimet
  async getAll(params?: { group?: string; key?: string }): Promise<Setting[]> {
    const response = await api.get('/settings', { params });
    return response.data;
  },

  // Merr cilësimet e organizatës
  async getOrganizationSettings(): Promise<Setting[]> {
    const response = await api.get('/settings/organization');
    return response.data;
  },

  // Merr cilësimet globale (public)
  async getPublicSettings(): Promise<Setting[]> {
    const response = await api.get('/settings/public');
    return response.data;
  },

  // Merr vlerën e një cilësimi
  async getValue(key: string, organizationId?: string): Promise<any> {
    const response = await api.get(`/settings/value/${key}`, { params: { organizationId } });
    return response.data;
  },

  // Vendos vlerën e një cilësimi
  async setValue(key: string, value: any, organizationId?: string): Promise<Setting> {
    const response = await api.put(`/settings/value/${key}`, { value, organizationId });
    return response.data;
  },

  // Krijo cilësim të ri
  async create(data: CreateSettingDto): Promise<Setting> {
    const response = await api.post('/settings', data);
    return response.data;
  },

  // Përditëso cilësimin
  async update(id: string, data: UpdateSettingDto): Promise<Setting> {
    const response = await api.put(`/settings/${id}`, data);
    return response.data;
  },

  // Fshij cilësimin
  async delete(id: string): Promise<void> {
    await api.delete(`/settings/${id}`);
  },

  // Inicializo cilësimet default
  async initializeDefaults(): Promise<{ message: string }> {
    const response = await api.post('/settings/initialize');
    return response.data;
  },
};