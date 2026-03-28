'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'ログインに失敗しました');
        return;
      }

      router.push(from);
    } catch {
      setError('サーバーへの接続に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const darkInput = 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert className="bg-red-950 border-red-800 text-red-300">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">メールアドレス</label>
        <Input
          type="email"
          placeholder="example@company.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
          disabled={loading}
          className={darkInput}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">パスワード</label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            disabled={loading}
            className={cn(darkInput, 'pr-10')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
      >
        {loading ? 'ログイン中...' : 'ログイン'}
      </Button>
    </form>
  );
}

export default function LoginClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-white text-xl font-semibold">IS Holdings</h1>
          <p className="text-zinc-400 text-sm mt-1">帳票管理システム</p>
        </div>

        {/* フォームカード */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-5">ログイン</h2>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
          <p className="text-xs text-zinc-500 text-center mt-5">
            ※ 現在は開発モードです。Cognito統合は準備中です。
          </p>
        </div>
      </div>
    </div>
  );
}
