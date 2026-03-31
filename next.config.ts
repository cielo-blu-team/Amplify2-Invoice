import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cloud Run デプロイに必要（Docker standalone モード）
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // firebase-admin / @google-cloud / puppeteer はサーバー専用のためバンドルせず Node.js の require() を使う
  // firebase クライアント SDK はブラウザでバンドルが必要なので含めない
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
    '@google-cloud/functions-framework',
    'puppeteer',
  ],
  outputFileTracingExcludes: {
    '*': [
      'puppeteer-core/**/*',
      'vitest/**/*',
      'playwright/**/*',
      '@playwright/**/*',
      'jsdom/**/*',
    ],
  },
};

export default nextConfig;
