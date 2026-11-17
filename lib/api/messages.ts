import apiClient from './client';
import type {
  KycReminderCatalogResponse,
  KycReminderHistoryResponse,
  SendBulkKycReminderRequest,
  SendBulkKycReminderResponse,
} from '../types/api';

export const messagesApi = {
  async getKycReminderCatalog(): Promise<KycReminderCatalogResponse> {
    const response = await apiClient.getClient().get<KycReminderCatalogResponse>(
      '/admin/messages/kyc-reminders',
    );
    return response.data;
  },

  async sendBulkKycReminder(
    data: SendBulkKycReminderRequest,
  ): Promise<SendBulkKycReminderResponse> {
    const response = await apiClient
      .getClient()
      .post<SendBulkKycReminderResponse>('/admin/messages/kyc-reminders/send', data);
    return response.data;
  },

  async getKycReminderHistory(params: {
    page?: number;
    limit?: number;
    search?: string;
    targetTier?: string;
    channel?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<KycReminderHistoryResponse> {
    const response = await apiClient
      .getClient()
      .get<KycReminderHistoryResponse>('/admin/messages/kyc-reminders/history', { params });
    return response.data;
  },
};
