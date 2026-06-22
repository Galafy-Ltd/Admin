import apiClient from './client';
import type { UsersResponse, User, SearchUsersResponse } from '../types/api';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  kycStatus?: 'pending' | 'completed';
  isAmlRestricted?: boolean;
}

export const usersApi = {
  async getUsers(params?: GetUsersParams): Promise<UsersResponse> {
    const response = await apiClient.getClient().get<UsersResponse>('/admin/users', { params });
    return response.data;
  },

  async getUserDetails(userId: string): Promise<User> {
    const response = await apiClient.getClient().get<User>(`/admin/users/${userId}`);
    return response.data;
  },

  async sendKycReminder(userId: string): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>(
      `/admin/users/${userId}/send-kyc-reminder`,
    );
    return response.data;
  },

  async approveTier3(customerId: string, notes?: string): Promise<unknown> {
    const response = await apiClient.getClient().patch(`/admin/customers/${customerId}/approve-tier-3`, {
      notes,
    });
    return response.data;
  },

  async restrictUser(userId: string, reason: string): Promise<User> {
    const response = await apiClient.getClient().post<User>(`/admin/users/${userId}/restrict`, { reason });
    return response.data;
  },

  async unrestrictUser(userId: string): Promise<User> {
    const response = await apiClient.getClient().post<User>(`/admin/users/${userId}/unrestrict`);
    return response.data;
  },

  async searchUsers(q: string): Promise<SearchUsersResponse> {
    const response = await apiClient.getClient().get<SearchUsersResponse>('/admin/users/search', {
      params: { q },
    });
    return response.data;
  },

  async exportUsers(params?: GetUsersParams): Promise<Blob> {
    const response = await apiClient.getClient().get('/admin/users/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
