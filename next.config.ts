import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
  },
  webpack: (config) => {
    // Replace puppeteer with a stub to prevent NFT from tracing Chromium and
    // the full puppeteer package during `Collecting build traces` (which OOMs).
    config.resolve.alias['puppeteer'] = path.resolve('./src/lib/puppeteer-stub.ts');
    return config;
  },
  outputFileTracingExcludes: {
    '*': [
      'puppeteer/**/*',
      'puppeteer-core/**/*',
      '@aws-sdk/**/*',
      'aws-cdk-lib/**/*',
      'constructs/**/*',
      '@aws-amplify/backend/**/*',
      '@aws-amplify/backend-cli/**/*',
      'vitest/**/*',
      'playwright/**/*',
      '@playwright/**/*',
      'jsdom/**/*',
    ],
  },
};

export default nextConfig;
