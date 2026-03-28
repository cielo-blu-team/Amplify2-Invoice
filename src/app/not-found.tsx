'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center space-y-5">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <FileSearch className="h-10 w-10 text-zinc-400" />
          </div>
        </div>
        <div>
          <h1 className="text-5xl font-bold text-zinc-900">404</h1>
          <p className="text-zinc-500 mt-2">ページが見つかりませんでした</p>
        </div>
        <Button asChild>
          <Link href="/dashboard">ダッシュボードに戻る</Link>
        </Button>
      </div>
    </div>
  );
}
