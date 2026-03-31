import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cloud Run デプロイに必要（Docker standalone モード）
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // サーバー専用パッケージ（Node.js require() を使用、バンドルしない）
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
    '@google-cloud/functions-framework',
    '@react-pdf/renderer',
  ],
  outputFileTracingExcludes: {
    '*': [
      'vitest/**/*',
      'playwright/**/*',
      '@playwright/**/*',
      'jsdom/**/*',
    ],
  },
};

export default nextConfig;
