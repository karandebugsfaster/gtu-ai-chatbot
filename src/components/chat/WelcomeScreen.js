'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

export default function WelcomeScreen({ onSendMessage, isAuthenticated }) {
  const { data: session } = useSession();

  const suggestions = [
    {
      icon: '📚',
      title: 'Explain OSI Model',
      description: 'Learn about networking layers'
    },
    {
      icon: '💻',
      title: 'What is polymorphism?',
      description: 'Understand OOP concepts'
    },
    {
      icon: '🔐',
      title: 'Database normalization',
      description: 'Learn about database design'
    },
    {
      icon: '⚡',
      title: 'Explain sorting algorithms',
      description: 'Compare different algorithms'
    }
  ];

  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-3"
          >
            {isAuthenticated 
              ? `Hello, ${session?.user?.name?.split(' ')[0] || 'Student'}! 👋`
              : 'Welcome to GTU AI Chatbot! 👋'
            }
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 mb-2"
          >
            How can I help you today?
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-500"
          >
            {isAuthenticated 
              ? 'Ask me anything about your course materials'
              : 'Sign in to get personalized answers from your course materials'
            }
          </motion.p>
        </motion.div>

        {/* Suggestion Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              onClick={() => onSendMessage(suggestion.title)}
              className="group relative bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-primary-300 hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{suggestion.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {suggestion.title}
                  </h3>
                  <p className="text-sm text-gray-500">{suggestion.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { icon: '🎯', text: 'Answers from your materials' },
            { icon: '⚡', text: 'Lightning fast responses' },
            { icon: '📖', text: 'Source citations included' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 justify-center text-gray-600">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}