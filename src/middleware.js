import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req:    request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ── Admin PAGES only ───────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = new URL('/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
    return NextResponse.next();
  }

  // ── Admin API routes ───────────────────────────────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (token.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // ── Auth redirect — already logged in ─────────────────────────────────────
  if ((pathname === '/signin' || pathname === '/signup') && token) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // ✅ ONLY these — NO /chat, NO /api/chat, NO /gtu, NO /qpg
    '/admin/:path*',
    '/api/admin/:path*',
    '/signin',
    '/signup',
  ],
};