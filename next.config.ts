import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cloud Run デプロイに必要（Docker standalone モード）
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // firebase-admin / @google-cloud はサーバー専用のためバンドルせず Node.js の require() を使う
  // firebase クライアント SDK はブラウザでバンドルが必要なので含めない
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
    '@google-cloud/functions-framework',
  ],
  // Next.js 16 はデフォルトで Turbopack を使用
  turbopack: {
    resolveAlias: {
      // Chromium トレースによる OOM を防ぐためスタブに差し替え
      puppeteer: './src/lib/puppeteer-stub.ts',
    },
  },
  outputFileTracingExcludes: {
    '*': [
      'puppeteer/**/*',
      'puppeteer-core/**/*',
      'vitest/**/*',
      'playwright/**/*',
      '@playwright/**/*',
      'jsdom/**/*',
    ],
  },
};

export default nextConfig;
