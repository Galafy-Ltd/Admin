import apiClient from './client';
import type { RolesResponse, RoleDetails, AssignRoleRequest } from '../types/api';

export interface GetRoleDetailsParams {
  page?: number;
  limit?: number;
}

export const rolesApi = {
  async getRoles(): Promise<RolesResponse> {
    const response = await apiClient.getClient().get<RolesResponse>('/admin/roles');
    return response.data;
  },

  async getRoleDetails(roleName: string, params?: GetRoleDetailsParams): Promise<RoleDetails> {
    const response = await apiClient.getClient().get<RoleDetails>(`/admin/roles/${roleName}`, { params });
    return response.data;
  },

  async assignRole(roleName: string, data: AssignRoleRequest): Promise<any> {
    const response = await apiClient.getClient().post(`/admin/roles/${roleName}/assign`, data);
    return response.data;
  },
};

