import apiClient from './client';
import type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../types/api';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    console.log('[Auth API] Attempting login for:', data.email);
    const response = await apiClient.getClient().post<LoginResponse>('/admin/auth/login', data);
    const { accessToken, refreshToken } = response.data;
    console.log('[Auth API] Login successful, setting tokens');
    apiClient.setTokens(accessToken, refreshToken);
    return response.data;
  },

  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.getClient().post<RefreshTokenResponse>('/admin/auth/refresh', data);
    const { accessToken, refreshToken } = response.data;
    apiClient.setTokens(accessToken, refreshToken);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.getClient().post('/admin/auth/logout');
    apiClient.logout();
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>('/admin/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>('/admin/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};

