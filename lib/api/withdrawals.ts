import apiClient from './client';
import type { WithdrawalsResponse } from '../types/api';

export interface GetWithdrawalsParams {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface RejectWithdrawalRequest {
  reason: string;
}

export const withdrawalsApi = {
  async getWithdrawals(params?: GetWithdrawalsParams): Promise<WithdrawalsResponse> {
    const response = await apiClient.getClient().get<WithdrawalsResponse>('/admin/withdrawals', { params });
    return response.data;
  },

  async approveWithdrawal(withdrawalId: string): Promise<any> {
    const response = await apiClient.getClient().post(`/admin/withdrawals/${withdrawalId}/approve`);
    return response.data;
  },

  async rejectWithdrawal(withdrawalId: string, data: RejectWithdrawalRequest): Promise<any> {
    const response = await apiClient.getClient().post(`/admin/withdrawals/${withdrawalId}/reject`, data);
    return response.data;
  },
};

