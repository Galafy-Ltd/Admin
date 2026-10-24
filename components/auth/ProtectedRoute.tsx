'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { buildLoginHref, isAuthenticated } from '@/lib/utils/auth';

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

const ProtectedRouteInner = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated: authIsAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !authIsAuthenticated && !isAuthenticated()) {
      const search = searchParams?.toString();
      const returnTo = `${pathname || '/'}${search ? `?${search}` : ''}`;
      router.push(buildLoginHref(returnTo));
    }
  }, [authIsAuthenticated, isLoading, pathname, router, searchParams]);

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!authIsAuthenticated && !isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<AuthLoading />}>
      <ProtectedRouteInner>{children}</ProtectedRouteInner>
    </Suspense>
  );
};
