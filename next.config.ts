import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
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
