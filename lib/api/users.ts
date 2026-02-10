import apiClient from './client';
import type { UsersResponse, User } from '../types/api';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
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

  async restrictUser(userId: string, reason: string): Promise<User> {
    const response = await apiClient.getClient().post<User>(`/admin/users/${userId}/restrict`, { reason });
    return response.data;
  },

  async unrestrictUser(userId: string): Promise<User> {
    const response = await apiClient.getClient().post<User>(`/admin/users/${userId}/unrestrict`);
    return response.data;
  },
};

