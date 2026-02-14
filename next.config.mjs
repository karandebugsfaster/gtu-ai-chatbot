/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdfjs-dist', 'sharp'],
  turbopack: {},
};

export default nextConfig;