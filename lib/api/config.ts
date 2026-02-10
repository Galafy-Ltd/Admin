import apiClient from './client';
import type { Config, ConfigsResponse } from '../types/api';

export interface GetConfigsParams {
  category?: string;
  isActive?: boolean;
}

export interface CreateConfigRequest {
  key: string;
  category: string;
  value: string;
  type: string;
  description: string;
}

export interface UpdateConfigRequest {
  value: string;
  description?: string;
}

export const configApi = {
  async getConfigs(params?: GetConfigsParams): Promise<ConfigsResponse> {
    const response = await apiClient.getClient().get<ConfigsResponse>('/admin/config', { params });
    return response.data;
  },

  async getConfigByKey(key: string): Promise<Config> {
    const response = await apiClient.getClient().get<Config>(`/admin/config/${key}`);
    return response.data;
  },

  async getConfigsByCategory(category: string): Promise<Config[]> {
    const response = await apiClient.getClient().get<Config[]>(`/admin/config/category/${category}`);
    return response.data;
  },

  async updateConfig(key: string, data: UpdateConfigRequest): Promise<Config> {
    const response = await apiClient.getClient().put<Config>(`/admin/config/${key}`, data);
    return response.data;
  },

  async createConfig(data: CreateConfigRequest): Promise<Config> {
    const response = await apiClient.getClient().post<Config>('/admin/config', data);
    return response.data;
  },

  async deleteConfig(key: string): Promise<{ message: string }> {
    const response = await apiClient.getClient().delete<{ message: string }>(`/admin/config/${key}`);
    return response.data;
  },
};

