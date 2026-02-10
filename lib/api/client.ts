import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base URL includes /api prefix as the server routes are under /api/admin/...
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

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
        console.log('[API Client] Access token loaded:', this.accessToken);
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

        // Handle 401 and 403 errors - try to refresh token
        if ((error.response?.status === 401 || error.response?.status === 403) && 
            !originalRequest._retry && 
            this.refreshToken) {
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
            // Refresh failed, logout
            this.logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // If 403 and no refresh token or refresh failed, redirect to login
        if (error.response?.status === 403 && !this.refreshToken) {
          console.warn('[API Client] 403 Forbidden - No refresh token available');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
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

    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
    }
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

