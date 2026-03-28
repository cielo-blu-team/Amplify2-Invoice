'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Bell, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/settings',               label: '自社情報',   Icon: Building2 },
  { href: '/settings/notifications', label: '通知設定',   Icon: Bell },
  { href: '/settings/users',         label: 'ユーザー管理', Icon: Users },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">設定</h2>
        <p className="text-sm text-zinc-500 mt-0.5">自社情報・通知・ユーザーを管理します</p>
      </div>

      {/* Tab navigation */}
      <div
        className="inline-flex gap-1 rounded-xl p-1"
        style={{ background: 'rgba(0,0,0,0.06)' }}
      >
        {tabs.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'text-indigo-600 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
              style={isActive ? {
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
              } : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
