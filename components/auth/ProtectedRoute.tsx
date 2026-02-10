'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { isAuthenticated } from '@/lib/utils/auth';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { isAuthenticated: authIsAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !authIsAuthenticated && !isAuthenticated()) {
      router.push('/login');
    }
  }, [authIsAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authIsAuthenticated && !isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
};

