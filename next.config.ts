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
    // Force GC after webpack compilation to free the compilation object before
    // TypeScript worker and static generation phases start (prevents OOM spike).
    config.plugins.push({
      apply(compiler: { hooks: { done: { tapAsync: (name: string, fn: (stats: unknown, cb: () => void) => void) => void } } }) {
        compiler.hooks.done.tapAsync('ForceGC', (_stats, callback) => {
          if (typeof (global as { gc?: () => void }).gc === 'function') {
            (global as { gc: () => void }).gc();
          }
          callback();
        });
      },
    });
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
