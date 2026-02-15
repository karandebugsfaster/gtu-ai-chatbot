// ✅ NEW — accepts pre-fetched server session, no client round-trip
'use client';
import { SessionProvider } from 'next-auth/react';

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  );
}