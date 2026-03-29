import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 2,
  },
  turbopack: {
    // Replace puppeteer with a stub to prevent NFT from tracing Chromium
    // during `Collecting build traces` (which OOMs on Amplify).
    resolveAlias: {
      puppeteer: './src/lib/puppeteer-stub.ts',
    },
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
