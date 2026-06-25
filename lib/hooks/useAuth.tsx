'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { Admin, LoginRequest, LoginResponse } from '@/lib/types/api';
import { getStoredTokens } from '@/lib/utils/auth';

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  completeTwoFactorLogin: (tempToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function persistAdminSession(admin: Admin) {
  localStorage.setItem('admin_data', JSON.stringify(admin));
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [admin, setAdmin] = useState<Admin | null>(null);

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

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const isAuthenticated = !!admin && !!getStoredTokens().accessToken;

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
