'use client';

import { useState } from 'react';

export default function ChatMessage({ message, isLast }) {
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const sources = message.metadata?.sources || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      padding: '2rem 0',
      background: isUser ? 'white' : '#f9fafb',
      borderBottom: '1px solid #f3f4f6'
    }}>
      <div style={{ 
        maxWidth: '48rem',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative' }}>
          {/* Avatar */}
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: isUser 
              ? '#111827' 
              : 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            {isUser ? (
              <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>

          {/* Message Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.9375rem',
              lineHeight: '1.75',
              color: '#111827',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {message.content}
            </div>

            {/* Sources */}
            {!isUser && sources.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => setShowSources(!showSources)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem 0',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                >
                  <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>{sources.length} {sources.length === 1 ? 'source' : 'sources'}</span>
                  <svg 
                    style={{ 
                      width: '1rem', 
                      height: '1rem',
                      transform: showSources ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSources && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sources.map((source, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: '0.8125rem',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          padding: '0.75rem'
                        }}
                      >
                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                          {source.title}
                        </div>
                        {source.pageNumber && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Page {source.pageNumber}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            style={{
              padding: '0.375rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              color: '#9ca3af',
              transition: 'all 0.2s ease',
              opacity: 0,
              position: 'absolute',
              right: 0,
              top: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
            className="copy-button"
          >
            {copied ? (
              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .copy-button {
          opacity: 0;
        }
        div:hover .copy-button {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}