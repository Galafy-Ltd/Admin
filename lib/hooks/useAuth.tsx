'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import apiClient from '@/lib/api/client';
import type { Admin, LoginRequest } from '@/lib/types/api';
import { getStoredTokens } from '@/lib/utils/auth';

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [admin, setAdmin] = useState<Admin | null>(null);

  const { data: adminData, isLoading } = useQuery({
    queryKey: ['admin'],
    queryFn: async () => {
      const tokens = getStoredTokens();
      if (!tokens.accessToken) return null;

      // Try to get admin info from token or make a request
      // For now, we'll store admin info in localStorage after login
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

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAdmin(data.admin);
      localStorage.setItem('admin_data', JSON.stringify(data.admin));
      queryClient.setQueryData(['admin'], data.admin);
      router.push('/dashboard');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      setAdmin(null);
      queryClient.clear();
      router.push('/login');
    },
  });

  const login = async (data: LoginRequest) => {
    await loginMutation.mutateAsync(data);
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
        isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
        login,
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

