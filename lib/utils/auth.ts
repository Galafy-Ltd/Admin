/** Set before redirecting to login when the API returns 401; login page reads and clears it. */
export const AUTH_SESSION_NOTICE_STORAGE_KEY = 'galafy_auth_notice';
export const AUTH_SESSION_NOTICE_EXPIRED = 'session_expired';
export const AUTH_SESSION_NOTICE_IDLE = 'idle_timeout';

/** Idle auto sign-out after 15 minutes of no user activity. */
export const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

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

/** Query param on `/login` for post-auth return path. */
export const AUTH_RETURN_TO_QUERY = 'next';

const AUTH_PUBLIC_PATH_PREFIXES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/reset-success',
  '/accept-invite',
];

/**
 * Only allow same-origin relative paths (open-redirect safe).
 * Rejects protocol-relative URLs, absolute URLs, and auth public pages.
 */
export const getSafeInternalPath = (raw: string | null | undefined): string | null => {
  if (!raw) return null;

  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    /* keep original */
  }

  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return null;
  }

  const pathname = path.split('?')[0]?.split('#')[0] || path;
  if (AUTH_PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  return path;
};

/** Build `/login` or `/login?next=...` from an optional return path. */
export const buildLoginHref = (returnTo?: string | null): string => {
  const safe = getSafeInternalPath(returnTo);
  if (!safe) return '/login';
  return `/login?${AUTH_RETURN_TO_QUERY}=${encodeURIComponent(safe)}`;
};

/** Current path + search for return-to (client only). */
export const getCurrentReturnToPath = (): string | null => {
  if (typeof window === 'undefined') return null;
  return `${window.location.pathname}${window.location.search}`;
};

/** Resolve post-login destination from `?next=` (falls back to dashboard). */
export const resolvePostLoginPath = (search?: string | null): string => {
  const query =
    search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  return getSafeInternalPath(params.get(AUTH_RETURN_TO_QUERY)) ?? '/dashboard';
};

