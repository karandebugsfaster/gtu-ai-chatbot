import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req:    request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ── /admin pages — must be logged in AND be admin ──────────────────────────
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

  // ── /api/admin routes — must be admin ─────────────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (token.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ── /signin /signup — redirect to chat if already logged in ───────────────
  if (pathname.startsWith('/signin') || pathname.startsWith('/signup')) {
    if (token) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
    return NextResponse.next();
  }

  // ── Everything else (chat, gtu, qpg, api/chat, api/gtu...) ────────────────
  // ✅ Allow ALL users through — API routes handle their own auth internally
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/signin',
    '/signup',
  ],
};