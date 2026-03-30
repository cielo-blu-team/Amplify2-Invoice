'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Command } from 'lucide-react';

const PAGE_TITLES: { pattern: RegExp | string; title: string }[] = [
  { pattern: '/dashboard',          title: 'ダッシュボード' },
  { pattern: '/analytics',          title: '分析' },
  { pattern: '/estimates/new',      title: '見積書 新規作成' },
  { pattern: /^\/estimates\/[^/]+\/preview$/, title: 'PDF プレビュー' },
  { pattern: /^\/estimates\/[^/]+$/, title: '見積書 詳細' },
  { pattern: '/estimates',          title: '見積書' },
  { pattern: '/invoices/new',       title: '請求書 新規作成' },
  { pattern: /^\/invoices\/[^/]+\/preview$/, title: 'PDF プレビュー' },
  { pattern: /^\/invoices\/[^/]+$/, title: '請求書 詳細' },
  { pattern: '/invoices',           title: '請求書' },
  { pattern: '/approvals',          title: '承認' },
  { pattern: '/templates/new',      title: 'テンプレート 新規作成' },
  { pattern: '/templates',          title: 'テンプレート' },
  { pattern: '/clients/new',        title: '取引先 新規登録' },
  { pattern: /^\/clients\/[^/]+\/edit$/, title: '取引先 編集' },
  { pattern: '/clients',            title: '取引先' },
  { pattern: '/projects/new',       title: '案件 新規登録' },
  { pattern: /^\/projects\/[^/]+\/edit$/, title: '案件 編集' },
  { pattern: /^\/projects\/[^/]+$/, title: '案件 詳細' },
  { pattern: '/projects',           title: '案件管理' },
  { pattern: '/payments',           title: '入金管理' },
  { pattern: '/expenses',           title: '経費管理' },
  { pattern: '/audit-logs',         title: '監査ログ' },
  { pattern: '/settings',           title: '設定' },
];

function resolveTitle(pathname: string): string {
  for (const { pattern, title } of PAGE_TITLES) {
    if (typeof pattern === 'string') {
      if (pathname === pattern || pathname.startsWith(pattern + '/')) return title;
    } else {
      if (pattern.test(pathname)) return title;
    }
  }
  return '';
}

export default function Header() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header
      className="h-12 flex items-center justify-between px-5 flex-shrink-0 relative"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Gradient top accent */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />

      <div className="flex items-center gap-3">
        {title && (
          <h1
            className="text-base font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #4f52e8 0%, #8b5cf6 60%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          className="relative hidden md:flex items-center cursor-pointer group"
          style={{
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '0.5rem',
            padding: '0 10px',
            height: '28px',
            width: '180px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.1)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)';
          }}
        >
          <Search className="h-3 w-3 flex-shrink-0 mr-2" style={{ color: 'rgba(0,0,0,0.3)' }} />
          <span className="text-xs flex-1" style={{ color: 'rgba(0,0,0,0.3)' }}>検索...</span>
          <div
            className="flex items-center gap-0.5 ml-2"
            style={{ color: 'rgba(0,0,0,0.25)', fontSize: '9px' }}
          >
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>

        {/* Notification bell */}
        <button
          className="relative h-7 w-7 flex items-center justify-center rounded-lg transition-all"
          style={{
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)';
          }}
        >
          <Bell className="h-3.5 w-3.5" style={{ color: 'rgba(0,0,0,0.45)' }} />
          <span
            className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full pulse-dot"
            style={{ background: '#818cf8' }}
          />
        </button>

        {/* Avatar */}
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold cursor-pointer flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 0 12px rgba(99,102,241,0.35)',
            border: '1.5px solid rgba(99,102,241,0.4)',
          }}
        >
          U
        </div>
      </div>
    </header>
  );
}
