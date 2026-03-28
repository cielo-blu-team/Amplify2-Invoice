'use client';

import { usePathname } from 'next/navigation';
import AppShellLayout from '@/components/layout/AppShell';

const NO_SHELL_PATHS = ['/login', '/forbidden'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noShell = NO_SHELL_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (noShell) return <>{children}</>;
  return <AppShellLayout>{children}</AppShellLayout>;
}
