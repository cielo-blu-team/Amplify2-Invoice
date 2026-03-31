'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BarChart2, FileText, Receipt,
  CheckSquare, Copy, Building2, FolderKanban,
  CreditCard, ClipboardList, Settings, LogOut, Zap, Wallet,
} from 'lucide-react';

type NavItem = { href: string; label: string; Icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'メイン',
    items: [
      { href: '/dashboard', label: 'ダッシュボード', Icon: LayoutDashboard },
      { href: '/analytics',  label: '分析',           Icon: BarChart2 },
    ],
  },
  {
    label: '帳票管理',
    items: [
      { href: '/estimates', label: '見積書',      Icon: FileText },
      { href: '/invoices',  label: '請求書',      Icon: Receipt },
      { href: '/approvals', label: '承認',        Icon: CheckSquare },
      { href: '/templates', label: 'テンプレート', Icon: Copy },
    ],
  },
  {
    label: '顧客・案件',
    items: [
      { href: '/clients',  label: '取引先',   Icon: Building2 },
      { href: '/projects', label: '案件管理', Icon: FolderKanban },
    ],
  },
  {
    label: '財務管理',
    items: [
      { href: '/payments',  label: '入金管理', Icon: CreditCard },
      { href: '/expenses',  label: '経費管理', Icon: Wallet },
    ],
  },
  {
    label: 'システム',
    items: [
      { href: '/audit-logs', label: '監査ログ', Icon: ClipboardList },
      { href: '/settings',   label: '設定',     Icon: Settings },
    ],
  },
];

function isActive(href: string, pathname: string) {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-screen relative overflow-hidden"
      style={{ background: '#06060d', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Top gradient line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

      {/* Background mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative px-4 pt-5 pb-4 flex items-center gap-2.5">
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 0 16px rgba(99,102,241,0.4), 0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-white tracking-wide">IS Holdings</p>
          <p
            className="text-[9px] mt-0.5 leading-none font-semibold"
            style={{
              background: 'linear-gradient(90deg, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            帳票管理システム
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p
              className="px-2 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, Icon }) => {
                const active = isActive(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group relative overflow-hidden',
                      !active && 'hover:bg-white/5'
                    )}
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.22) 100%)',
                      border: '1px solid rgba(129,140,248,0.45)',
                      color: '#c7d2fe',
                      boxShadow: '0 0 20px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
                    } : {
                      color: 'rgba(255,255,255,0.42)',
                      border: '1px solid transparent',
                    }}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-indigo-400" />
                    )}
                    <Icon
                      className="h-3.5 w-3.5 flex-shrink-0 transition-colors"
                      style={active ? { color: '#818cf8' } : {}}
                    />
                    <span className="truncate">{label}</span>
                    {active && (
                      <span
                        className="ml-auto h-1.5 w-1.5 rounded-full flex-shrink-0 pulse-dot"
                        style={{ background: '#818cf8' }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4">
        <div className="mx-2 h-px mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group hover:bg-red-500/10"
          style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#f87171';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)';
            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
          }}
        >
          <LogOut className="h-3.5 w-3.5 transition-colors" />
          ログアウト
        </button>
      </div>
    </aside>
  );
}
