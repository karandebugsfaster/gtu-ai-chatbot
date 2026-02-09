import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === 'admin';
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // Protect admin routes
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/chat', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Allow access to these routes without authentication
        const publicRoutes = ['/chat', '/gtu', '/qpg'];
        const isPublicRoute = publicRoutes.some(route => 
          req.nextUrl.pathname.startsWith(route)
        );

        // Admin routes require authentication
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token;
        }

        // Public routes don't require auth
        if (isPublicRoute) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/chat/:path*',
    '/gtu/:path*',
    '/qpg/:path*',
  ],
};