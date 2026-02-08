'use client';

export default function Loader({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`}></div>
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
}