import apiClient from './client';
import type { KYCRequestsResponse, KYCRequest } from '../types/api';

export interface GetKYCParams {
  page?: number;
  limit?: number;
  tier?: string;
}

export const kycApi = {
  async getPendingRequests(params?: GetKYCParams): Promise<KYCRequestsResponse> {
    const response = await apiClient.getClient().get<KYCRequestsResponse>('/admin/kyc/pending', { params });
    return response.data;
  },

  async getPendingUtilityBills(params?: GetKYCParams): Promise<KYCRequestsResponse> {
    const response = await apiClient.getClient().get<KYCRequestsResponse>('/admin/kyc/utility-bills/pending', { params });
    return response.data;
  },

  async approveRequest(requestId: string, notes?: string): Promise<KYCRequest> {
    const response = await apiClient.getClient().post<KYCRequest>(`/admin/kyc/requests/${requestId}/approve`, { notes });
    return response.data;
  },

  async rejectRequest(requestId: string, reason: string): Promise<KYCRequest> {
    const response = await apiClient.getClient().post<KYCRequest>(`/admin/kyc/requests/${requestId}/reject`, { reason });
    return response.data;
  },

  async approveUtilityBill(submissionId: string, notes?: string): Promise<any> {
    const response = await apiClient.getClient().post(`/admin/kyc/utility-bills/${submissionId}/approve`, { notes });
    return response.data;
  },

  async rejectUtilityBill(submissionId: string, reason: string): Promise<any> {
    const response = await apiClient.getClient().post(`/admin/kyc/utility-bills/${submissionId}/reject`, { reason });
    return response.data;
  },
};

