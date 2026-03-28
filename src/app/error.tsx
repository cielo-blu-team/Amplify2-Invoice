'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center space-y-5 max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">エラーが発生しました</h2>
          <p className="text-sm text-zinc-500 mt-2">予期しないエラーが発生しました。しばらく待ってから再度お試しください。</p>
          {error.digest && <p className="text-xs text-zinc-400 mt-1">エラーID: {error.digest}</p>}
        </div>
        <Button onClick={reset}>再試行</Button>
      </div>
    </div>
  );
}
