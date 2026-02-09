'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/InputBox';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

function ChatContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (sessionId && session) {
      loadChatHistory(sessionId);
    }
  }, [sessionId, session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async (sid) => {
    try {
      const response = await fetch(`/api/chat/history?sessionId=${sid}`);
      const data = await response.json();
      
      if (data.success && data.chat) {
        setMessages(data.chat.messages || []);
        setCurrentSessionId(sid);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSendMessage = async (message, context) => {
    if (!message.trim()) return;

    // Check if user is authenticated
    if (!session) {
      toast.error('Please sign in to use the chat feature');
      router.push('/signin');
      return;
    }

    // Create new session if none exists
    let sid = currentSessionId;
    if (!sid) {
      try {
        const response = await fetch('/api/chat/new-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context })
        });
        const data = await response.json();
        if (data.success) {
          sid = data.sessionId;
          setCurrentSessionId(sid);
        }
      } catch (error) {
        toast.error('Failed to create chat session');
        return;
      }
    }

    // Add user message immediately
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          message,
          context
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          metadata: {
            sources: data.sources || [],
            hasContext: data.metadata?.hasContext || false
          }
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Show auth prompt for unauthenticated users */}
      {!session && status !== 'loading' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-3 text-center"
        >
          <p className="text-sm">
            Sign in to save your chat history and access all features
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/signin')}
              className="ml-3 !text-white border-white hover:bg-white/20"
            >
              Sign In
            </Button>
          </p>
        </motion.div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSendMessage={handleSendMessage} isAuthenticated={!!session} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isLast={index === messages.length - 1}
                />
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 mb-6"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl p-4">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box */}
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}