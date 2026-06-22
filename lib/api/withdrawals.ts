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

export const withdrawalsApi = {
  async getWithdrawals(params?: GetWithdrawalsParams): Promise<WithdrawalsResponse> {
    const response = await apiClient.getClient().get<WithdrawalsResponse>('/admin/withdrawals', { params });
    return response.data;
  },
};
