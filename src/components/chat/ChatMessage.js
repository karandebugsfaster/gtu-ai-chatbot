// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import ReactMarkdown from 'react-markdown';

// // ─── CHAT MESSAGE COMPONENT ────────────────────────────────────────────────────
// export default function ChatMessage({ message, isLast }) {
//   const isUser = message.role === 'user';
//   const [copied, setCopied] = useState(false);
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     // Slight stagger for smooth entrance
//     const t = setTimeout(() => setVisible(true), 20);
//     return () => clearTimeout(t);
//   }, []);

//   const handleCopy = async () => {
//     await navigator.clipboard.writeText(message.content);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   return (
//     <div
//       style={{
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: isUser ? 'flex-end' : 'flex-start',
//         padding: '0.85rem 1.5rem',
//         opacity: visible ? 1 : 0,
//         transform: visible
//           ? 'translateY(0)'
//           : isUser ? 'translateY(8px)' : 'translateY(8px)',
//         transition: 'opacity 0.25s ease, transform 0.25s ease',
//         maxWidth: '100%',
//       }}
//     >
//       {/* Avatar + name row — only for AI */}
//       {!isUser && (
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '0.5rem',
//           marginBottom: '0.5rem',
//           paddingLeft: '0.25rem',
//         }}>
//           {/* AI Avatar */}
//           <div style={{
//             width: '1.75rem',
//             height: '1.75rem',
//             borderRadius: '0.5rem',
//             background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             flexShrink: 0,
//             boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
//           }}>
//             <svg style={{ width: '1rem', height: '1rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
//                 d="M13 10V3L4 14h7v7l9-11h-7z" />
//             </svg>
//           </div>
//           <span style={{
//             fontSize: '0.75rem',
//             fontWeight: '600',
//             color: '#6b7280',
//             letterSpacing: '0.02em',
//           }}>
//             GTU AI
//           </span>
//         </div>
//       )}

//       {/* Message bubble + copy button row */}
//       <div style={{
//         display: 'flex',
//         alignItems: 'flex-end',
//         gap: '0.5rem',
//         flexDirection: isUser ? 'row-reverse' : 'row',
//         maxWidth: 'min(85%, 680px)',
//         width: '100%',
//         // justifyContent: isUser ? 'flex-end' : 'flex-start',
//       }}>

//         {/* Bubble */}
//         <div
//           className={isUser ? 'user-bubble' : 'ai-bubble'}
//           style={{
//             padding: isUser ? '0.75rem 1rem' : '1rem 1.125rem',
//             borderRadius: isUser
//               ? '1.125rem 1.125rem 0.25rem 1.125rem'
//               : '0.25rem 1.125rem 1.125rem 1.125rem',
//             background: isUser
//               ? 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)'
//               : 'white',
//             color:  isUser ? 'white' : '#1a1a2e',
//             fontSize: '0.9375rem',
//             lineHeight: '1.7',
//             boxShadow: isUser
//               ? '0 4px 15px rgba(99,102,241,0.25)'
//               : '0 2px 12px rgba(0,0,0,0.08)',
//             border: isUser ? 'none' : '1px solid #f0f0f5',
//             wordBreak: 'break-word',
//             maxWidth: '100%',
//             position: 'relative',
//           }}
//         >
//           {isUser ? (
//             // User message — plain text
//             <p style={{ margin: 0, fontWeight: '450' }}>
//               {message.content}
//             </p>
//           ) : (
//             // AI message — markdown rendered
//             <div className="ai-markdown">
//               <ReactMarkdown
//                 components={{
//                   p: ({ children }) => (
//                     <p style={{ margin: '0 0 0.625rem 0' }}>{children}</p>
//                   ),
//                   p_last: ({ children }) => (
//                     <p style={{ margin: 0 }}>{children}</p>
//                   ),
//                   strong: ({ children }) => (
//                     <strong style={{ fontWeight: '700', color: '#111827' }}>{children}</strong>
//                   ),
//                   em: ({ children }) => (
//                     <em style={{ color: '#6366f1' }}>{children}</em>
//                   ),
//                   code: ({ inline, children }) =>
//                     inline ? (
//                       <code style={{
//                         background: '#f3f4f6',
//                         padding: '0.125rem 0.375rem',
//                         borderRadius: '0.375rem',
//                         fontSize: '0.875em',
//                         fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
//                         color: '#6366f1',
//                         border: '1px solid #e5e7eb',
//                       }}>
//                         {children}
//                       </code>
//                     ) : (
//                       <pre style={{
//                         background: '#0f0f17',
//                         padding: '1rem',
//                         borderRadius: '0.75rem',
//                         overflow: 'auto',
//                         margin: '0.75rem 0',
//                         border: '1px solid #1e1e2e',
//                       }}>
//                         <code style={{
//                           fontSize: '0.8125rem',
//                           fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
//                           color: '#e2e8f0',
//                           display: 'block',
//                           lineHeight: '1.6',
//                         }}>
//                           {children}
//                         </code>
//                       </pre>
//                     ),
//                   ul: ({ children }) => (
//                     <ul style={{
//                       paddingLeft: '1.25rem',
//                       margin: '0.5rem 0',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       gap: '0.25rem',
//                     }}>
//                       {children}
//                     </ul>
//                   ),
//                   ol: ({ children }) => (
//                     <ol style={{
//                       paddingLeft: '1.5rem',
//                       margin: '0.5rem 0',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       gap: '0.25rem',
//                     }}>
//                       {children}
//                     </ol>
//                   ),
//                   li: ({ children }) => (
//                     <li style={{ lineHeight: '1.6' }}>{children}</li>
//                   ),
//                   h1: ({ children }) => (
//                     <h1 style={{ fontSize: '1.125rem', fontWeight: '700', margin: '0.75rem 0 0.375rem', color: '#111827' }}>{children}</h1>
//                   ),
//                   h2: ({ children }) => (
//                     <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: '0.75rem 0 0.375rem', color: '#111827' }}>{children}</h2>
//                   ),
//                   h3: ({ children }) => (
//                     <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', margin: '0.625rem 0 0.25rem', color: '#374151' }}>{children}</h3>
//                   ),
//                   blockquote: ({ children }) => (
//                     <blockquote style={{
//                       borderLeft: '3px solid #6366f1',
//                       paddingLeft: '0.875rem',
//                       margin: '0.625rem 0',
//                       color: '#4b5563',
//                       fontStyle: 'italic',
//                     }}>
//                       {children}
//                     </blockquote>
//                   ),
//                   hr: () => (
//                     <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0.75rem 0' }} />
//                   ),
//                 }}
//               >
//                 {message.content}
//               </ReactMarkdown>
//             </div>
//           )}
//         </div>

//         {/* Copy button */}
//         <button
//           onClick={handleCopy}
//           className="copy-btn"
//           title="Copy"
//           style={{
//             flexShrink: 0,
//             width: '1.875rem',
//             height: '1.875rem',
//             borderRadius: '0.5rem',
//             border: '1px solid #e5e7eb',
//             background: 'white',
//             cursor: 'pointer',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             color: copied ? '#10b981' : '#9ca3af',
//             transition: 'all 0.15s ease',
//             marginBottom: '0.25rem',
//             opacity: 0,
//           }}
//         >
//           {copied ? (
//             <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
//             </svg>
//           ) : (
//             <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                 d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
//             </svg>
//           )}
//         </button>
//       </div>


// {/* ✅ DIAGRAM IMAGES - Show BEFORE text content */}
// {message.metadata?.diagrams?.length > 0 && (
//   <div style={{
//     marginTop: '1rem',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '1rem',
//     maxWidth: '100%',
//   }}>
//     {message.metadata.diagrams.map((diagram, i) => (
//       <div key={i} style={{
//         border: '1px solid #e5e7eb',
//         borderRadius: '0.75rem',
//         overflow: 'hidden',
//         background: 'white',
//         boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//       }}>
//         {/* Diagram Image */}
//         <img
//           src={diagram.imageUrl}
//           alt={diagram.figureNumber || diagram.caption || 'Diagram'}
//           style={{
//             width: '100%',
//             height: 'auto',
//             display: 'block',
//             maxHeight: '600px',
//             objectFit: 'contain',
//             background: '#f9fafb',
//           }}
//           onError={(e) => {
//             console.error('Failed to load diagram:', diagram.imageUrl);
//             e.target.style.display = 'none';
//           }}
//         />
        
//         {/* Caption */}
//         {(diagram.figureNumber || diagram.caption) && (
//           <div style={{
//             padding: '0.75rem 1rem',
//             background: '#f9fafb',
//             borderTop: '1px solid #e5e7eb',
//           }}>
//             <div style={{
//               fontSize: '0.875rem',
//               fontWeight: '600',
//               color: '#374151',
//               marginBottom: '0.25rem',
//             }}>
//               {diagram.figureNumber || 'Diagram'}
//             </div>
//             {diagram.caption && (
//               <div style={{
//                 fontSize: '0.8125rem',
//                 color: '#6b7280',
//                 lineHeight: '1.5',
//               }}>
//                 {diagram.caption}
//               </div>
//             )}
//             {diagram.documentTitle && (
//               <div style={{
//                 fontSize: '0.75rem',
//                 color: '#9ca3af',
//                 marginTop: '0.375rem',
//               }}>
//                 Source: {diagram.documentTitle} (Page {diagram.pageNumber})
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     ))}
//   </div>
// )}

//       {/* Sources */}
//       {!isUser && message.sources?.length > 0 && (
//         <SourcesPanel sources={message.sources} />
//       )}

//       {/* Timestamp */}
//       <div style={{
//         fontSize: '0.6875rem',
//         color: '#9ca3af',
//         marginTop: '0.375rem',
//         paddingLeft: isUser ? 0 : '0.25rem',
//         paddingRight: isUser ? '0.25rem' : 0,
//       }}>
//         {formatTime(message.timestamp)}
//       </div>
//     </div>
//   );
// }

// // ─── SOURCES PANEL ─────────────────────────────────────────────────────────────
// function SourcesPanel({ sources }) {
//   const [open, setOpen] = useState(false);

//   return (
//     <div style={{
//       marginTop: '0.5rem',
//       paddingLeft: '0.25rem',
//       maxWidth: 'min(85%, 680px)',
//     }}>
//       <button
//         onClick={() => setOpen(p => !p)}
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '0.375rem',
//           background: 'none',
//           border: 'none',
//           cursor: 'pointer',
//           fontSize: '0.75rem',
//           fontWeight: '600',
//           color: '#6366f1',
//           padding: '0.25rem 0',
//           transition: 'opacity 0.15s ease',
//         }}
//       >
//         <svg
//           style={{
//             width: '0.875rem', height: '0.875rem',
//             transition: 'transform 0.2s ease',
//             transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
//           }}
//           fill="none" stroke="currentColor" viewBox="0 0 24 24"
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//         </svg>
//         {sources.length} source{sources.length > 1 ? 's' : ''}
//       </button>

//       {open && (
//         <div style={{
//           display: 'flex',
//           flexDirection: 'column',
//           gap: '0.375rem',
//           marginTop: '0.375rem',
//         }}>
//           {sources.map((src, i) => (
//             <div key={i} style={{
//               display: 'flex',
//               alignItems: 'center',
//               gap: '0.625rem',
//               padding: '0.5rem 0.75rem',
//               background: 'white',
//               border: '1px solid #e5e7eb',
//               borderRadius: '0.625rem',
//               fontSize: '0.8125rem',
//             }}>
//               <div style={{
//                 width: '1.5rem', height: '1.5rem',
//                 background: '#f5f3ff',
//                 borderRadius: '0.375rem',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 fontSize: '0.75rem', flexShrink: 0,
//               }}>
//                 📄
//               </div>
//               <div style={{ flex: 1, minWidth: 0 }}>
//                 <div style={{ fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                   {src.title}
//                 </div>
//                 {src.subject && (
//                   <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{src.subject}</div>
//                 )}
//               </div>
//               {src.relevance && (
//                 <span style={{
//                   fontSize: '0.6875rem', fontWeight: '700',
//                   color: src.relevance > 80 ? '#10b981' : src.relevance > 60 ? '#f59e0b' : '#6b7280',
//                   background: src.relevance > 80 ? '#f0fdf4' : src.relevance > 60 ? '#fffbeb' : '#f9fafb',
//                   padding: '0.125rem 0.5rem',
//                   borderRadius: '2rem',
//                   flexShrink: 0,
//                 }}>
//                   {src.relevance}%
//                 </span>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── TYPING INDICATOR ──────────────────────────────────────────────────────────
// export function TypingIndicator() {
//   return (
//     <div style={{
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'flex-start',
//       padding: '0.25rem 1.5rem',
//     }}>
//       {/* AI label */}
//       <div style={{
//         display: 'flex', alignItems: 'center', gap: '0.5rem',
//         marginBottom: '0.5rem', paddingLeft: '0.25rem',
//       }}>
//         <div style={{
//           width: '1.75rem', height: '1.75rem',
//           borderRadius: '0.5rem',
//           background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
//         }}>
//           <svg style={{ width: '1rem', height: '1rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
//           </svg>
//         </div>
//         <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>GTU AI</span>
//       </div>

//       {/* Dots */}
//       <div style={{
//         padding: '0.875rem 1.125rem',
//         background: 'white',
//         borderRadius: '0.25rem 1.125rem 1.125rem 1.125rem',
//         border: '1px solid #f0f0f5',
//         boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
//         display: 'flex',
//         alignItems: 'center',
//         gap: '0.375rem',
//       }}>
//         {[0, 1, 2].map(i => (
//           <div
//             key={i}
//             style={{
//               width: '0.4375rem',
//               height: '0.4375rem',
//               borderRadius: '50%',
//               background: '#6366f1',
//               animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
//               opacity: 0.4,
//             }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── HELPERS ───────────────────────────────────────────────────────────────────
// function formatTime(timestamp) {
//   if (!timestamp) return '';
//   const d = new Date(timestamp);
//   const now = new Date();
//   const isToday = d.toDateString() === now.toDateString();
//   return isToday
//     ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//     : d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
// }
'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// ─── CHAT MESSAGE COMPONENT ────────────────────────────────────────────────────
export default function ChatMessage({ message, isLast }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        padding: '0.85rem 1.5rem',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        maxWidth: '100%',
      }}
    >
      {/* Avatar + name row — only for AI */}
      {!isUser && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          paddingLeft: '0.25rem',
        }}>
          <div style={{
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}>
            <svg style={{ width: '1rem', height: '1rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#6b7280',
            letterSpacing: '0.02em',
          }}>
            GTU AI
          </span>
        </div>
      )}

      {/* Message bubble + copy button row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.5rem',
        flexDirection: isUser ? 'row-reverse' : 'row',
        maxWidth: 'min(85%, 680px)',
        width: '100%',
      }}>
        {/* Bubble */}
        <div
          className={isUser ? 'user-bubble' : 'ai-bubble'}
          style={{
            padding: isUser ? '0.75rem 1rem' : '1rem 1.125rem',
            borderRadius: isUser
              ? '1.125rem 1.125rem 0.25rem 1.125rem'
              : '0.25rem 1.125rem 1.125rem 1.125rem',
            background: isUser
              ? 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)'
              : 'white',
            color: isUser ? 'white' : '#1a1a2e',
            fontSize: '0.9375rem',
            lineHeight: '1.7',
            boxShadow: isUser
              ? '0 4px 15px rgba(99,102,241,0.25)'
              : '0 2px 12px rgba(0,0,0,0.08)',
            border: isUser ? 'none' : '1px solid #f0f0f5',
            wordBreak: 'break-word',
            maxWidth: '100%',
            position: 'relative',
          }}
        >
          {isUser ? (
            <p style={{ margin: 0, fontWeight: '450' }}>
              {message.content}
            </p>
          ) : (
            <div className="ai-markdown">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ margin: '0 0 0.625rem 0' }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: '700', color: '#111827' }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em style={{ color: '#6366f1' }}>{children}</em>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code style={{
                        background: '#f3f4f6',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875em',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        color: '#6366f1',
                        border: '1px solid #e5e7eb',
                      }}>
                        {children}
                      </code>
                    ) : (
                      <pre style={{
                        background: '#0f0f17',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        overflow: 'auto',
                        margin: '0.75rem 0',
                        border: '1px solid #1e1e2e',
                      }}>
                        <code style={{
                          fontSize: '0.8125rem',
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          color: '#e2e8f0',
                          display: 'block',
                          lineHeight: '1.6',
                        }}>
                          {children}
                        </code>
                      </pre>
                    ),
                  ul: ({ children }) => (
                    <ul style={{
                      paddingLeft: '1.25rem',
                      margin: '0.5rem 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{
                      paddingLeft: '1.5rem',
                      margin: '0.5rem 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}>
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ lineHeight: '1.6' }}>{children}</li>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="copy-btn"
          title="Copy"
          style={{
            flexShrink: 0,
            width: '1.875rem',
            height: '1.875rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: copied ? '#10b981' : '#9ca3af',
            transition: 'all 0.15s ease',
            marginBottom: '0.25rem',
            opacity: 0,
          }}
        >
          {copied ? (
            <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* ✅ DIAGRAM IMAGES */}
      {message.metadata?.diagrams?.length > 0 && (
        <div style={{
          marginTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '100%',
        }}>
          {message.metadata.diagrams.map((diagram, i) => (
            <div key={i} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              background: 'white',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}>
              <img
                src={diagram.imageUrl}
                alt={diagram.figureNumber || diagram.caption || 'Diagram'}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: '600px',
                  objectFit: 'contain',
                  background: '#f9fafb',
                }}
                onError={(e) => {
                  console.error('Failed to load diagram:', diagram.imageUrl);
                  e.target.style.display = 'none';
                }}
              />
              
              {(diagram.figureNumber || diagram.caption) && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  borderTop: '1px solid #e5e7eb',
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.25rem',
                  }}>
                    {diagram.figureNumber || 'Diagram'}
                  </div>
                  {diagram.caption && (
                    <div style={{
                      fontSize: '0.8125rem',
                      color: '#6b7280',
                      lineHeight: '1.5',
                    }}>
                      {diagram.caption}
                    </div>
                  )}
                  {diagram.documentTitle && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      marginTop: '0.375rem',
                    }}>
                      Source: {diagram.documentTitle} (Page {diagram.pageNumber})
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sources */}
      {!isUser && message.metadata?.sources?.length > 0 && (
        <SourcesPanel sources={message.metadata.sources} />
      )}

      {/* Timestamp */}
      <div style={{
        fontSize: '0.6875rem',
        color: '#9ca3af',
        marginTop: '0.375rem',
        paddingLeft: isUser ? 0 : '0.25rem',
        paddingRight: isUser ? '0.25rem' : 0,
      }}>
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
}

// ─── SOURCES PANEL ─────────────────────────────────────────────────────────────
function SourcesPanel({ sources }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      marginTop: '0.5rem',
      paddingLeft: '0.25rem',
      maxWidth: 'min(85%, 680px)',
    }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#6366f1',
          padding: '0.25rem 0',
          transition: 'opacity 0.15s ease',
        }}
      >
        <svg
          style={{
            width: '0.875rem',
            height: '0.875rem',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {sources.length} source{sources.length > 1 ? 's' : ''}
      </button>

      {open && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          marginTop: '0.375rem',
        }}>
          {sources.map((src, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.625rem',
              fontSize: '0.8125rem',
            }}>
              <div style={{
                width: '1.5rem',
                height: '1.5rem',
                background: '#f5f3ff',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                flexShrink: 0,
              }}>
                📄
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: '600',
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {src.title}
                </div>
                {src.subject && (
                  <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{src.subject}</div>
                )}
              </div>
              {src.relevance && (
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: '700',
                  color: src.relevance > 80 ? '#10b981' : src.relevance > 60 ? '#f59e0b' : '#6b7280',
                  background: src.relevance > 80 ? '#f0fdf4' : src.relevance > 60 ? '#fffbeb' : '#f9fafb',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '2rem',
                  flexShrink: 0,
                }}>
                  {src.relevance}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TYPING INDICATOR ──────────────────────────────────────────────────────────
export function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '0.25rem 1.5rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem',
        paddingLeft: '0.25rem',
      }}>
        <div style={{
          width: '1.75rem',
          height: '1.75rem',
          borderRadius: '0.5rem',
          background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
        }}>
          <svg style={{ width: '1rem', height: '1rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>GTU AI</span>
      </div>

      <div style={{
        padding: '0.875rem 1.125rem',
        background: 'white',
        borderRadius: '0.25rem 1.125rem 1.125rem 1.125rem',
        border: '1px solid #f0f0f5',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '0.4375rem',
              height: '0.4375rem',
              borderRadius: '50%',
              background: '#6366f1',
              animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}