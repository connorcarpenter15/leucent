/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@leucent/ui', '@leucent/shared-protocol', '@leucent/db'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

export default nextConfig;
