/** @type {import('next').NextConfig} */
const nextConfig = {

  // ✅ FIXED: moved OUT of experimental (Next.js 16)
  serverExternalPackages: [
    '@xenova/transformers',
    'onnxruntime-node',
    'sharp',
  ],

  // ✅ FIXED: Add empty turbopack config to silence the warning
  // (tells Next.js you're aware Turbopack is active)
  turbopack: {},

  // ✅ REMOVED: webpack config — conflicts with Turbopack in Next.js 16
  // If you need webpack fallbacks, use turbopack.resolveAlias instead

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Silence the specific warnings that are just noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
