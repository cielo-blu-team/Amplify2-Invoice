'use client';

import { CheckCircle2, CircleDashed, ExternalLink } from 'lucide-react';

export default function IntegrationsClient({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* MFロゴ相当のアイコン */}
            <div className="w-12 h-12 rounded-lg bg-[#003087] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold leading-tight text-center">MF<br/>会計</span>
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

          <a
            href="/api/auth/mf/start"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex-shrink-0"
            style={isConnected ? {
              borderColor: '#d1d5db',
              color: '#6b7280',
            } : {
              background: '#003087',
              borderColor: '#003087',
              color: '#ffffff',
            }}
          >
            <ExternalLink className="h-4 w-4" />
            {isConnected ? '再連携' : 'MFと連携する'}
          </a>
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
  );
}
