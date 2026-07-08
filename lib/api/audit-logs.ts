import apiClient from './client';
import type { LogsResponse } from '../types/api';

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  adminId?: string;
  actionType?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

export const auditLogsApi = {
  async getLogs(params?: GetAuditLogsParams): Promise<LogsResponse> {
    const response = await apiClient.getClient().get<LogsResponse>('/admin/logs', { params });
    return response.data;
  },

  async exportLogs(params?: GetAuditLogsParams): Promise<Blob> {
    const response = await apiClient.getClient().get('/admin/logs/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
