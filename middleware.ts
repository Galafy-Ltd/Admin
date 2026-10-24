import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('admin_access_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/reset-success', '/accept-invite'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If accessing a protected route without a token, redirect to login
  if (!isPublicRoute && !token) {
    // Check localStorage is not available in middleware, so we'll handle client-side
    // For now, allow the request and handle redirect in the component
    return NextResponse.next();
  }

  // If accessing login page while authenticated, honor safe ?next= or dashboard
  if (pathname === '/login' && token) {
    const next = request.nextUrl.searchParams.get('next');
    let destination = '/dashboard';
    if (next) {
      try {
        const decoded = decodeURIComponent(next);
        if (
          decoded.startsWith('/') &&
          !decoded.startsWith('//') &&
          !decoded.includes('://')
        ) {
          destination = decoded;
        }
      } catch {
        /* keep dashboard */
      }
    }
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

