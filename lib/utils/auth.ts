/** Set before redirecting to login when the API returns 401; login page reads and clears it. */
export const AUTH_SESSION_NOTICE_STORAGE_KEY = 'galafy_auth_notice';
export const AUTH_SESSION_NOTICE_EXPIRED = 'session_expired';

export const getStoredTokens = () => {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };

  return {
    accessToken: localStorage.getItem('admin_access_token'),
    refreshToken: localStorage.getItem('admin_refresh_token'),
  };
};

export const setStoredTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('admin_access_token', accessToken);
  localStorage.setItem('admin_refresh_token', refreshToken);
};

export const clearStoredTokens = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
};

/** Clears tokens and cached admin profile (call when session is invalid or user logs out). */
export const clearLocalAuthSession = () => {
  clearStoredTokens();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_data');
  }
};

export const isAuthenticated = (): boolean => {
  const { accessToken } = getStoredTokens();
  return !!accessToken;
};

