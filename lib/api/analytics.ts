import apiClient from './client';
import type { TransactionAnalytics } from '../types/api';

export interface GetAnalyticsParams {
  startDate?: string;
  endDate?: string;
}

export const analyticsApi = {
  async getTransactionSummary(params?: GetAnalyticsParams): Promise<TransactionAnalytics> {
    const response = await apiClient.getClient().get<TransactionAnalytics>('/admin/analytics/transaction-summary', {
      params,
    });
    return response.data;
  },
};

