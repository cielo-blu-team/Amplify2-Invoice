'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldOff } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center space-y-5">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-red-50 flex items-center justify-center">
            <ShieldOff className="h-10 w-10 text-red-400" />
          </div>
        </div>
        <div>
          <h1 className="text-5xl font-bold text-zinc-900">403</h1>
          <p className="text-zinc-600 font-medium mt-2">アクセスが拒否されました</p>
          <p className="text-zinc-500 text-sm mt-1">このページにアクセスする権限がありません。</p>
        </div>
        <Button asChild>
          <Link href="/dashboard">ダッシュボードへ戻る</Link>
        </Button>
      </div>
    </div>
  );
}
