'use client';

import { useState } from 'react';
import { CheckCircle2, CircleDashed, ExternalLink, ShieldAlert, X, Lock } from 'lucide-react';

export default function IntegrationsClient({ isConnected }: { isConnected: boolean }) {
  const [modal, setModal] = useState<'error' | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/mf/start');
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || data.error) {
        setModal('error');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setModal('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#003087] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold leading-tight text-center">MF<br />会計</span>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">マネーフォワード クラウド会計</h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  仕訳データを取り込み、経費・売掛金の自動照合を行います
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-600 font-medium">連携済み</span>
                    </>
                  ) : (
                    <>
                      <CircleDashed className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm text-zinc-500">未連携</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex-shrink-0 disabled:opacity-60"
              style={isConnected ? {
                borderColor: '#d1d5db',
                color: '#6b7280',
                background: '#ffffff',
              } : {
                background: '#003087',
                borderColor: '#003087',
                color: '#ffffff',
              }}
            >
              <ExternalLink className="h-4 w-4" />
              {loading ? '処理中...' : isConnected ? '再連携' : 'MFと連携する'}
            </button>
          </div>

          {!isConnected && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700">
                連携にはマネーフォワード クラウド会計の管理者権限が必要です。
                ボタンをクリックするとマネーフォワードの認証画面に移動します。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 権限エラーモーダル */}
      {modal === 'error' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setModal(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 上部カラーバー */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-400 via-rose-500 to-red-600" />

            {/* 閉じるボタン */}
            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-8 pt-8 pb-8">
              {/* アイコン */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                    <ShieldAlert className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center border-2 border-white">
                    <Lock className="h-3 w-3 text-red-500" />
                  </div>
                </div>
              </div>

              {/* テキスト */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-zinc-900 mb-2">
                  管理者権限が必要です
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  マネーフォワード クラウド会計との連携設定は、
                  <span className="font-medium text-zinc-700">管理者（admin）</span>
                  のみ実行できます。
                </p>
              </div>

              {/* 区切り線 */}
              <div className="my-6 border-t border-zinc-100" />

              {/* 説明 */}
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-2.5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">必要なロール</p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    admin
                  </span>
                  <span className="text-sm text-zinc-600">管理者ロールが必要です</span>
                </div>
                <p className="text-xs text-zinc-400">
                  ロールの変更は「設定 → ユーザー管理」から管理者が行えます。
                </p>
              </div>

              {/* ボタン */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  閉じる
                </button>
                <a
                  href="/settings/users"
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl text-center text-white transition-colors"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                  ユーザー管理へ
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
