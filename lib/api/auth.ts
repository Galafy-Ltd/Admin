import apiClient from './client';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
} from '../types/api';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.getClient().post<LoginResponse>('/admin/auth/login', data);
    if (response.data.accessToken && response.data.refreshToken) {
      apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    return response.data;
  },

  async verifyTwoFactor(tempToken: string, code: string): Promise<LoginResponse> {
    const response = await apiClient.getClient().post<LoginResponse>('/admin/auth/verify-2fa', {
      tempToken,
      code,
    });
    if (response.data.accessToken && response.data.refreshToken) {
      apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    return response.data;
  },

  async getTwoFactorStatus(): Promise<TwoFactorStatusResponse> {
    const response = await apiClient.getClient().get<TwoFactorStatusResponse>('/admin/auth/2fa/status');
    return response.data;
  },

  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    const response = await apiClient.getClient().post<TwoFactorSetupResponse>('/admin/auth/2fa/setup');
    return response.data;
  },

  async enableTwoFactor(code: string): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>('/admin/auth/2fa/enable', { code });
    return response.data;
  },

  async disableTwoFactor(code: string): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>('/admin/auth/2fa/disable', { code });
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
