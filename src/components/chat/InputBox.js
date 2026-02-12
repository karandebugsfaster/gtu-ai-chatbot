'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    adjustHeight();
  }, [message]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={{ 
      borderTop: '1px solid #e5e7eb',
      background: 'white',
      padding: '1rem 0'
    }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.75rem',
            background: 'white',
            border: '2px solid #d1d5db',
            borderRadius: '1.5rem',
            padding: '0.75rem 1rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            }
          }}
          >
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message GTU AI..."
              disabled={disabled}
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                outline: 'none',
                border: 'none',
                background: 'transparent',
                color: '#111827',
                fontSize: '0.9375rem',
                lineHeight: '1.5',
                maxHeight: '200px',
                overflow: 'auto',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}
            />

            {/* Send Button */}
            {message.trim() && (
              <button
                type="submit"
                disabled={disabled}
                style={{
                  flexShrink: 0,
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: disabled ? '#9ca3af' : 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            )}
          </div>

          {/* Helper Text */}
          <p style={{ 
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#9ca3af',
            marginTop: '0.75rem'
          }}>
            GTU AI can make mistakes. Check important info.
          </p>
        </form>
      </div>
    </div>
  );
}