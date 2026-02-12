'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (session) {
      fetchChatHistory();
    }
  }, [session]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history');
      const data = await response.json();
      if (data.success) {
        setChatHistory(data.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const createNewChat = async () => {
    if (!session) {
      router.push('/signin');
      return;
    }

    try {
      const response = await fetch('/api/chat/new-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' })
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/chat?session=${data.sessionId}`);
        fetchChatHistory();
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const menuItems = [
    { 
      icon: (
        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      label: 'Chat', 
      href: '/chat' 
    },
    { 
      icon: (
        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      label: 'GTU Resources', 
      href: '/gtu' 
    },
    { 
      icon: (
        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: 'Question Papers', 
      href: '/qpg' 
    },
    { 
      icon: (
        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Pricing', 
      href: '/pricing' 
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={onClose}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '16rem',
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: isOpen ? '4px 0 12px rgba(0, 0, 0, 0.1)' : 'none'
        }}
        className="sidebar"
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #f3f4f6'
        }}>
          {/* New Chat Button */}
          <button
            onClick={createNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
            }}
          >
            <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Navigation */}
        <div style={{
          padding: '0.5rem',
          borderBottom: '1px solid #f3f4f6'
        }}>
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                onClick={() => onClose && onClose()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: isActive ? '#6366f1' : '#374151',
                  background: isActive ? '#f5f3ff' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  marginBottom: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.color = '#111827';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
              >
                <div style={{ color: isActive ? '#6366f1' : '#9ca3af' }}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Chat History */}
        {session && chatHistory.length > 0 && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0.75rem',
              marginBottom: '0.25rem'
            }}>
              Recent Chats
            </div>
            {chatHistory.slice(0, 20).map((chat) => (
              <Link
                key={chat._id}
                href={`/chat?session=${chat.sessionId}`}
                onClick={() => onClose && onClose()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  color: '#374151',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  marginBottom: '0.25rem',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.paddingLeft = '1rem';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.paddingLeft = '0.75rem';
                }}
              >
                <svg style={{ width: '1rem', height: '1rem', color: '#9ca3af', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {chat.title}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #f3f4f6',
          background: 'linear-gradient(180deg, transparent 0%, #f9fafb 100%)'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            <div style={{ fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
              GTU AI Chatbot
            </div>
            <div>Powered by OpenAI</div>
          </div>
        </div>
      </aside>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (min-width: 1024px) {
          .sidebar {
            transform: translateX(0) !important;
            position: relative !important;
          }
          .sidebar-overlay {
            display: none;
          }
        }

        /* Custom Scrollbar */
        aside::-webkit-scrollbar {
          width: 6px;
        }
        aside::-webkit-scrollbar-track {
          background: transparent;
        }
        aside::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        aside::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </>
  );
}