import apiClient from './client';
import type { NotificationsResponse, Notification } from '../types/api';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  readStatus?: 'read' | 'unread';
  type?: string;
  startDate?: string;
  endDate?: string;
}

export const notificationsApi = {
  async getNotifications(params?: GetNotificationsParams): Promise<NotificationsResponse> {
    const response = await apiClient.getClient().get<NotificationsResponse>('/admin/notifications', { params });
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.getClient().patch<Notification>(`/admin/notifications/${notificationId}/read`);
    return response.data;
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await apiClient.getClient().get<{ unreadCount: number }>('/admin/notifications/unread-count');
    return response.data;
  },
};

