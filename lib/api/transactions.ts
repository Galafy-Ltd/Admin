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

  async downloadReceipt(transactionId: string): Promise<{ blob: Blob; filename: string }> {
    const response = await apiClient.getClient().get(`/admin/transactions/${transactionId}/receipt`, {
      responseType: 'blob',
    });
    const disposition = response.headers['content-disposition'] as string | undefined;
    let filename = `receipt-${transactionId}.csv`;
    if (disposition) {
      const match = disposition.match(/filename="?([^";\n]+)"?/i);
      if (match?.[1]) {
        filename = match[1];
      }
    }
    return { blob: response.data, filename };
  },
};

