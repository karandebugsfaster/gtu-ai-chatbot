/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only packages on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false,
        'onnxruntime-node': false,
      };
    }
    return config;
  },

  experimental: {
    serverComponentsExternalPackages: [
      '@xenova/transformers',
      'onnxruntime-node',
    ],
  },
};

export default nextConfig;