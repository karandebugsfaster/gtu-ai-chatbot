import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ✅ Skip ALL API routes — they handle auth themselves
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req:    request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Admin pages
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = new URL('/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  // Already logged in → skip auth pages
  if ((pathname === '/signin' || pathname === '/signup') && token) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/signin',
    '/signup',
  ],
  // ✅ Explicitly NO /api routes in matcher
};