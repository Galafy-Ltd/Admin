'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { Admin, LoginRequest, LoginResponse } from '@/lib/types/api';
import {
  getStoredTokens,
  AUTH_SESSION_NOTICE_STORAGE_KEY,
  AUTH_SESSION_NOTICE_IDLE,
  ADMIN_IDLE_TIMEOUT_MS,
} from '@/lib/utils/auth';

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  completeTwoFactorLogin: (tempToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

function persistAdminSession(admin: Admin) {
  localStorage.setItem('admin_data', JSON.stringify(admin));
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggingOutForIdleRef = useRef(false);

  const { data: adminData, isLoading } = useQuery({
    queryKey: ['admin'],
    queryFn: async () => {
      const tokens = getStoredTokens();
      if (!tokens.accessToken) return null;

      const storedAdmin = localStorage.getItem('admin_data');
      return storedAdmin ? JSON.parse(storedAdmin) : null;
    },
    enabled: typeof window !== 'undefined',
  });

  useEffect(() => {
    if (adminData) {
      setAdmin(adminData);
    }
  }, [adminData]);

  const finishLogin = (data: LoginResponse) => {
    if (!data.admin) return;
    setAdmin(data.admin);
    persistAdminSession(data.admin);
    queryClient.setQueryData(['admin'], data.admin);
    router.push('/dashboard');
  };

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      if (!data.requires2FA) {
        finishLogin(data);
      }
    },
  });

  const verifyTwoFactorMutation = useMutation({
    mutationFn: ({ tempToken, code }: { tempToken: string; code: string }) =>
      authApi.verifyTwoFactor(tempToken, code),
    onSuccess: finishLogin,
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      setAdmin(null);
      queryClient.clear();
      router.push('/login');
    },
  });

  const login = async (data: LoginRequest) => loginMutation.mutateAsync(data);

  const completeTwoFactorLogin = async (tempToken: string, code: string) => {
    await verifyTwoFactorMutation.mutateAsync({ tempToken, code });
  };

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation.mutateAsync]);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const handleIdleTimeout = useCallback(async () => {
    if (loggingOutForIdleRef.current) return;
    loggingOutForIdleRef.current = true;
    try {
      sessionStorage.setItem(AUTH_SESSION_NOTICE_STORAGE_KEY, AUTH_SESSION_NOTICE_IDLE);
    } catch {
      /* ignore */
    }
    try {
      await logoutRef.current();
    } catch {
      setAdmin(null);
      queryClient.clear();
      router.push('/login');
    } finally {
      loggingOutForIdleRef.current = false;
    }
  }, [queryClient, router]);

  const resetIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      void handleIdleTimeout();
    }, ADMIN_IDLE_TIMEOUT_MS);
  }, [clearIdleTimer, handleIdleTimeout]);

  const isAuthenticated = !!admin && !!getStoredTokens().accessToken;

  useEffect(() => {
    if (!isAuthenticated) {
      clearIdleTimer();
      return;
    }

    resetIdleTimer();
    const onActivity = () => resetIdleTimer();
    for (const eventName of IDLE_ACTIVITY_EVENTS) {
      window.addEventListener(eventName, onActivity, { passive: true });
    }

    return () => {
      clearIdleTimer();
      for (const eventName of IDLE_ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, onActivity);
      }
    };
  }, [isAuthenticated, resetIdleTimer, clearIdleTimer]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        isLoading:
          isLoading ||
          loginMutation.isPending ||
          verifyTwoFactorMutation.isPending ||
          logoutMutation.isPending,
        login,
        completeTwoFactorLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
