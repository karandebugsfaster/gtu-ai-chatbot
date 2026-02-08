'use client';

import { motion } from 'framer-motion';

export default function Card({ 
  children, 
  className = '',
  hover = false,
  onClick,
  padding = 'md'
}) {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: ''
  };

  return (
    <motion.div
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm
        ${paddings[padding]}
        ${hover ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}