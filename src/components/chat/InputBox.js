// 'use client';

// import { useState, useRef, useEffect } from 'react';

// export default function ChatInput({ onSendMessage, disabled }) {
//   const [message, setMessage] = useState('');
//   const textareaRef = useRef(null);

//   useEffect(() => {
//     adjustHeight();
//   }, [message]);

//   const adjustHeight = () => {
//     const textarea = textareaRef.current;
//     if (textarea) {
//       textarea.style.height = 'auto';
//       textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (message.trim() && !disabled) {
//       onSendMessage(message.trim());
//       setMessage('');
//       if (textareaRef.current) {
//         textareaRef.current.style.height = 'auto';
//       }
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit(e);
//     }
//   };

//   return (
//     <div style={{ 
//       borderTop: '1px solid #e5e7eb',
//       background: 'white',
//       padding: '1rem 0'
//     }}>
//       <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1rem' }}>
//         <form onSubmit={handleSubmit}>
//           <div style={{
//             display: 'flex',
//             alignItems: 'flex-end',
//             gap: '0.75rem',
//             background: 'white',
//             border: '2px solid #d1d5db',
//             borderRadius: '1.5rem',
//             padding: '0.75rem 1rem',
//             transition: 'all 0.2s ease',
//             boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
//           }}
//           onFocus={(e) => {
//             e.currentTarget.style.borderColor = '#6366f1';
//             e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
//           }}
//           onBlur={(e) => {
//             if (!e.currentTarget.contains(e.relatedTarget)) {
//               e.currentTarget.style.borderColor = '#d1d5db';
//               e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
//             }
//           }}
//           >
//             {/* Textarea */}
//             <textarea
//               ref={textareaRef}
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder="Message GTU AI..."
//               disabled={disabled}
//               rows={1}
//               style={{
//                 flex: 1,
//                 resize: 'none',
//                 outline: 'none',
//                 border: 'none',
//                 background: 'transparent',
//                 color: '#111827',
//                 fontSize: '0.9375rem',
//                 lineHeight: '1.5',
//                 maxHeight: '200px',
//                 overflow: 'auto',
//                 fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
//               }}
//             />

//             {/* Send Button */}
//             {message.trim() && (
//               <button
//                 type="submit"
//                 disabled={disabled}
//                 style={{
//                   flexShrink: 0,
//                   width: '2rem',
//                   height: '2rem',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   background: disabled ? '#9ca3af' : 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
//                   color: 'white',
//                   border: 'none',
//                   borderRadius: '0.5rem',
//                   cursor: disabled ? 'not-allowed' : 'pointer',
//                   transition: 'all 0.2s ease',
//                   boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
//                 }}
//                 onMouseEnter={(e) => {
//                   if (!disabled) {
//                     e.currentTarget.style.transform = 'scale(1.05)';
//                     e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.transform = 'scale(1)';
//                   e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
//                 }}
//               >
//                 <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
//                 </svg>
//               </button>
//             )}
//           </div>

//           {/* Helper Text */}
//           <p style={{ 
//             textAlign: 'center',
//             fontSize: '0.75rem',
//             color: '#9ca3af',
//             marginTop: '0.75rem'
//           }}>
//             GTU AI can make mistakes. Check important info.
//           </p>
//         </form>
//       </div>
//     </div>
//   );
// }
// src/components/ChatInput.js
'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSendMessage, onFileUpload, disabled, uploadedFileName, onRemoveFile }) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('File too large. Maximum size is 20MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    try {
      await onFileUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isUploading) {
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
      background: 'white'
    }}>
      {/* File upload notification banner */}
      {uploadedFileName && (
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '48rem',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Asking from your document</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{uploadedFileName}</div>
            </div>
          </div>
          <button
            onClick={onRemoveFile}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.25rem 0.75rem',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            Remove
          </button>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <div style={{
          maxWidth: '48rem',
          margin: '0 auto',
          padding: '0.75rem 1rem 0',
        }}>
          <div style={{
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <svg style={{ width: '2rem', height: '2rem', color: '#ef4444' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isUploading}
                style={{
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={isUploading}
                style={{
                  background: isUploading ? '#9ca3af' : 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  padding: '0.375rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: isUploading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                {isUploading ? (
                  <>
                    <svg style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message input */}
      <div style={{ padding: '1rem 0' }}>
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
              {/* File upload button */}
              {!uploadedFileName && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  style={{
                    flexShrink: 0,
                    width: '2rem',
                    height: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    color: disabled ? '#9ca3af' : '#6b7280',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.color = '#6366f1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                  title="Upload PDF"
                >
                  <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message GTU AI..."
                disabled={disabled || isUploading}
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
                  disabled={disabled || isUploading}
                  style={{
                    flexShrink: 0,
                    width: '2rem',
                    height: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: (disabled || isUploading) ? '#9ca3af' : 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: (disabled || isUploading) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !isUploading) {
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
              {uploadedFileName 
                ? 'Asking questions from your uploaded document' 
                : 'Upload a PDF to ask questions from it, or ask general questions'
              }
            </p>
          </form>
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}