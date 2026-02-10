import apiClient from './client';
import type { EventsResponse, EventDetails } from '../types/api';

export interface GetEventsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  hostUserId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetSprayActivityParams {
  page?: number;
  limit?: number;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface GetTopSprayersParams {
  limit?: number;
  includeAnonymous?: boolean;
}

export const eventsApi = {
  async getEvents(params?: GetEventsParams): Promise<EventsResponse> {
    const response = await apiClient.getClient().get<EventsResponse>('/admin/events', { params });
    return response.data;
  },

  async getEventDetails(eventId: string): Promise<EventDetails> {
    const response = await apiClient.getClient().get<EventDetails>(`/admin/events/${eventId}`);
    return response.data;
  },

  async getSprayActivity(eventId: string, params?: GetSprayActivityParams): Promise<any> {
    const response = await apiClient.getClient().get(`/admin/events/${eventId}/spray-activity`, { params });
    return response.data;
  },

  async getTopSprayers(eventId: string, params?: GetTopSprayersParams): Promise<any> {
    const response = await apiClient.getClient().get(`/admin/events/${eventId}/top-sprayers`, { params });
    return response.data;
  },

  async suspendEvent(eventId: string): Promise<any> {
    const response = await apiClient.getClient().post(`/admin/events/${eventId}/suspend`);
    return response.data;
  },

  async downloadEventReport(eventId: string): Promise<Blob> {
    const response = await apiClient.getClient().get(`/admin/events/${eventId}/report`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

