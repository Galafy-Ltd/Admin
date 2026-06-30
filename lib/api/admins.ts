import apiClient from './client';
import type {
  InviteAdminRequest,
  InviteAdminResponse,
  AcceptInviteRequest,
  AcceptInviteResponse,
  AdminsResponse,
  AdminDetails,
} from '../types/api';

export interface GetAdminsParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateAdminRequest {
  role?: string;
  isActive?: boolean;
}

export const adminsApi = {
  async inviteAdmin(data: InviteAdminRequest): Promise<InviteAdminResponse> {
    const response = await apiClient.getClient().post<InviteAdminResponse>('/admin/admins/invite', data);
    return response.data;
  },

  async acceptInvite(data: AcceptInviteRequest): Promise<AcceptInviteResponse> {
    // This endpoint is public, so we use a direct axios call without auth
    const axios = (await import('axios')).default;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const response = await axios.post<AcceptInviteResponse>(`${API_BASE_URL}/admin/admins/accept-invite`, data);
    return response.data;
  },

  async getAdmins(params?: GetAdminsParams): Promise<AdminsResponse> {
    const response = await apiClient.getClient().get<AdminsResponse>('/admin/admins', { params });
    return response.data;
  },

  async getAdminDetails(adminId: string): Promise<AdminDetails> {
    const response = await apiClient.getClient().get<AdminDetails>(`/admin/admins/${adminId}`);
    return response.data;
  },

  async updateAdmin(adminId: string, data: UpdateAdminRequest): Promise<AdminDetails> {
    const response = await apiClient.getClient().patch<AdminDetails>(`/admin/admins/${adminId}`, data);
    return response.data;
  },

  async deactivateAdmin(adminId: string): Promise<AdminDetails> {
    const response = await apiClient.getClient().delete<AdminDetails>(`/admin/admins/${adminId}`);
    return response.data;
  },

  async cancelInvite(inviteId: string): Promise<{ message: string }> {
    const response = await apiClient.getClient().delete<{ message: string }>(`/admin/admins/invites/${inviteId}`);
    return response.data;
  },
};

