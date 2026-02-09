'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchChatHistory();
    }
  }, [session]);

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat/history');
      const data = await response.json();
      if (data.success) {
        setChatHistory(data.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
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
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const menuItems = [
    { icon: '💬', label: 'Chat', href: '/chat' },
    { icon: '🎓', label: 'GTU Resources', href: '/gtu' },
    { icon: '📝', label: 'Question Papers', href: '/qpg' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed lg:relative w-72 h-full bg-white border-r border-gray-200 z-30 flex flex-col"
      >
        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all shadow-lg shadow-primary-500/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="px-2 mb-4">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                pathname === item.href
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Chat History */}
        {session && (
          <div className="flex-1 overflow-hidden flex flex-col px-2">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Chats</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              ) : chatHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No chat history yet</p>
              ) : (
                chatHistory.map((chat) => (
                  <Link
                    key={chat._id}
                    href={`/chat?session=${chat.sessionId}`}
                    className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate group-hover:text-primary-600">
                          {chat.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(chat.lastActivity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>© 2024 GTU AI Chatbot</p>
            <p className="mt-1">Powered by AI</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}