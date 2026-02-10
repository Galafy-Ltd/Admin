import apiClient from './client';
import type { TransactionsResponse, TransactionDetails } from '../types/api';

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  direction?: string;
  userId?: string;
  walletId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const transactionsApi = {
  async getTransactions(params?: GetTransactionsParams): Promise<TransactionsResponse> {
    const response = await apiClient.getClient().get<TransactionsResponse>('/admin/transactions', { params });
    return response.data;
  },

  async getTransactionDetails(transactionId: string): Promise<TransactionDetails> {
    const response = await apiClient.getClient().get<TransactionDetails>(`/admin/transactions/${transactionId}`);
    return response.data;
  },

  async downloadReceipt(transactionId: string): Promise<Blob> {
    const response = await apiClient.getClient().get(`/admin/transactions/${transactionId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

