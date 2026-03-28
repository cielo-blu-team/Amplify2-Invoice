import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracing: false,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
