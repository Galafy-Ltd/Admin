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

export const isAuthenticated = (): boolean => {
  const { accessToken } = getStoredTokens();
  return !!accessToken;
};

