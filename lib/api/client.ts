import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  clearLocalAuthSession,
  AUTH_SESSION_NOTICE_STORAGE_KEY,
  AUTH_SESSION_NOTICE_EXPIRED,
} from '@/lib/utils/auth';

// Base URL includes /api prefix as the server routes are under /api/admin/...
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

let sessionExpiryRedirectScheduled = false;

function redirectToLoginSessionExpired() {
  if (typeof window === 'undefined' || sessionExpiryRedirectScheduled) return;
  sessionExpiryRedirectScheduled = true;
  try {
    sessionStorage.setItem(AUTH_SESSION_NOTICE_STORAGE_KEY, AUTH_SESSION_NOTICE_EXPIRED);
  } catch {
    /* ignore */
  }
  window.location.assign('/login');
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      paramsSerializer: (params) => {
        if (!params) return '';
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        });
        return searchParams.toString();
      },
    });

    // Load tokens from localStorage on initialization
    this.loadTokensFromStorage();

    this.setupInterceptors();
  }

  private loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('admin_access_token');
      this.refreshToken = localStorage.getItem('admin_refresh_token');
      
      // Log token status (without exposing full token)
      if (this.accessToken) {
        console.log('[API Client] Access token loaded from storage');
      } else {
        console.warn('[API Client] No access token found in storage');
      }
    }
  }

  private setupInterceptors() {
    // Request interceptor - add auth token and log requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Reload tokens from storage before each request to ensure we have the latest
        this.loadTokensFromStorage();

        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }

        // Log request details
        const url = `${config.baseURL}${config.url}`;
        console.log('[API Request]', {
          method: config.method?.toUpperCase(),
          url,
          headers: {
            Authorization: config.headers.Authorization ? 'Bearer ***' : 'None',
            'Content-Type': config.headers['Content-Type'],
          },
          params: config.params,
          data: config.data,
        });

        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh and log responses
    this.client.interceptors.response.use(
      (response) => {
        // Log successful responses
        console.log('[API Response]', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Log error responses
        console.error('[API Error]', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: originalRequest?.url,
          method: originalRequest?.method?.toUpperCase(),
          data: error.response?.data,
          headers: error.response?.headers,
          requestHeaders: originalRequest?.headers,
        });

        const status = error.response?.status;
        const reqUrl = originalRequest?.url ?? '';

        // Do not treat credential / public auth failures as "session expired"
        const isPublicAuthPath =
          reqUrl.includes('/admin/auth/login') ||
          reqUrl.includes('/admin/auth/forgot-password') ||
          reqUrl.includes('/admin/auth/reset-password');

        if (status === 401 && !isPublicAuthPath) {
          const isRefreshCall = reqUrl.includes('/admin/auth/refresh');

          if (isRefreshCall) {
            this.clearTokens();
            redirectToLoginSessionExpired();
            return Promise.reject(error);
          }

          if (!originalRequest._retry && this.refreshToken) {
            originalRequest._retry = true;
            console.log('[API Client] Attempting to refresh token...');
            try {
              const refreshed = await this.refreshAccessToken();
              if (refreshed && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
                console.log('[API Client] Token refreshed, retrying request...');
                return this.client(originalRequest);
              }
            } catch (refreshError) {
              console.error('[API Client] Token refresh failed:', refreshError);
            }
            // Refresh threw or returned false — clear session and send user to login
            this.clearTokens();
            redirectToLoginSessionExpired();
            return Promise.reject(error);
          }

          // 401 and no refresh token (or retry already attempted)
          this.clearTokens();
          redirectToLoginSessionExpired();
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.warn('[API Client] No refresh token available');
      return false;
    }

    try {
      console.log('[API Client] Refreshing access token...');
      // Use direct axios call to avoid circular dependency with interceptors
      const response = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
        refreshToken: this.refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { accessToken, refreshToken } = response.data;
      this.setTokens(accessToken, refreshToken);
      console.log('[API Client] Token refresh successful');
      return true;
    } catch (error: any) {
      console.error('[API Client] Token refresh failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return false;
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_access_token', accessToken);
      localStorage.setItem('admin_refresh_token', refreshToken);
      console.log('[API Client] Tokens saved to storage');
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    clearLocalAuthSession();
  }

  logout() {
    if (this.accessToken) {
      // Try to call logout endpoint, but don't wait for it
      this.client.post('/admin/auth/logout').catch(() => {
        // Ignore errors on logout
      });
    }
    this.clearTokens();
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  // Method to manually reload tokens from storage (useful after login)
  reloadTokens() {
    this.loadTokensFromStorage();
  }
}

export const apiClient = new ApiClient();
export default apiClient;

