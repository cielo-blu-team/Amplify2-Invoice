import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Noto_Sans_JP } from 'next/font/google';
import LayoutWrapper from './LayoutWrapper';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '請求書・見積書作成システム',
  description: 'IS Holdings 帳票管理システム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${jakarta.variable} ${notoSansJP.variable}`}>
      <body className={`${jakarta.className} ${notoSansJP.variable}`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
