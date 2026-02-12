'use client';

import { useSession } from 'next-auth/react';

export default function WelcomeScreen({ onSendMessage, isAuthenticated }) {
  const { data: session } = useSession();

  const suggestions = [
    {
      icon: '🌐',
      title: 'Explain the OSI model',
      description: 'Learn about networking layers'
    },
    {
      icon: '💻',
      title: 'What is polymorphism in OOP?',
      description: 'Understand object-oriented concepts'
    },
    {
      icon: '🔐',
      title: 'Explain database normalization',
      description: 'Learn about database design'
    },
    {
      icon: '⚡',
      title: 'Compare sorting algorithms',
      description: 'Understand algorithm efficiency'
    }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: 'calc(100vh - 200px)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '56rem', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '4rem',
            height: '4rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
            borderRadius: '1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.3)'
          }}>
            <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '0.75rem',
            lineHeight: '1.2'
          }}>
            {isAuthenticated 
              ? `Hello, ${session?.user?.name?.split(' ')[0] || 'there'}! 👋`
              : 'How can I help you today?'
            }
          </h1>
          
          {!isAuthenticated && (
            <p style={{ 
              fontSize: '0.875rem',
              color: '#6b7280',
              maxWidth: '32rem',
              margin: '0 auto'
            }}>
              Sign in to save your conversations and access all features
            </p>
          )}
        </div>

        {/* Suggestion Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '3rem'
        }}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSendMessage(suggestion.title)}
              style={{
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '1rem',
                padding: '1.25rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                <div style={{
                  fontSize: '1.75rem',
                  flexShrink: 0,
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {suggestion.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '0.25rem',
                    lineHeight: '1.4'
                  }}>
                    {suggestion.title}
                  </h3>
                  <p style={{ 
                    fontSize: '0.8125rem',
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    {suggestion.description}
                  </p>
                </div>
                <svg 
                  style={{ 
                    width: '1.25rem', 
                    height: '1.25rem', 
                    color: '#9ca3af',
                    flexShrink: 0,
                    marginTop: '0.25rem'
                  }} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Features Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%)',
          borderRadius: '1rem',
          border: '1px solid #e0e7ff'
        }}>
          {[
            { icon: '🎯', text: 'Accurate answers from GTU materials' },
            { icon: '⚡', text: 'Fast AI-powered responses' },
            { icon: '📚', text: 'Comprehensive study resources' }
          ].map((feature, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '1.5rem' }}>{feature.icon}</span>
              <span style={{ 
                fontSize: '0.8125rem',
                color: '#4f46e5',
                fontWeight: '500'
              }}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}