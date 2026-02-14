/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'pdf-parse',
    'sharp',
  ],
  // ✅ Removed @xenova/transformers and onnxruntime-node
  turbopack: {},
};

export default nextConfig;