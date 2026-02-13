'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.replace('/signin');
      return;
    }

    if (session.user?.role !== 'admin') {
      router.replace('/chat');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8faff'
      }}>
        <p>Checking access...</p>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff' }}>
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 1.5rem',
        height: '3.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontWeight: '700' }}>
          GTU Admin Panel
        </span>

        <Link href="/chat">
          Back to App
        </Link>
      </div>

      <main>{children}</main>

      <Toaster position="top-right" />
    </div>
  );
}
