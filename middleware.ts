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

  // If accessing login page while authenticated, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

