/**
 * 日次バッチ API
 *
 * Cloud Scheduler からのトリガーで以下を順次実行:
 * 1. MF仕訳の自動取り込み + AI分類
 * 2. 支払催促通知チェック + Slack送信
 *
 * POST /api/batch/daily
 *
 * 認証: Cloud Scheduler の OIDC トークン or 内部呼び出し
 * (開発時は認証なしで呼び出し可能)
 */

import { NextResponse } from 'next/server';
import { runMfSync } from '@/services/mf-sync.service';
import { checkAndSendReminders } from '@/services/payment-reminder.service';
import * as settingsRepo from '@/repositories/system-settings.repository';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Cloud Scheduler からの呼び出し認証（本番時）
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        );
      }
      // TODO: OIDC トークンの検証（Google Auth Library）
    }

    const results: Record<string, unknown> = {};

    // 1. MF仕訳取り込み
    const settings = await settingsRepo.getSystemSettings();
    if (settings.mfSyncEnabled) {
      try {
        const syncResult = await runMfSync();
        results.mfSync = {
          status: 'success',
          ...syncResult,
        };
      } catch (err) {
        results.mfSync = {
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        };
      }
    } else {
      results.mfSync = { status: 'skipped', reason: 'MF同期が無効です' };
    }

    // 2. 支払催促通知
    try {
      const reminderResult = await checkAndSendReminders();
      results.reminders = {
        status: 'success',
        ...reminderResult,
      };
    } catch (err) {
      results.reminders = {
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    return NextResponse.json({
      success: true,
      executedAt: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error('[Batch Daily] 予期しないエラー:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : '予期しないエラーが発生しました',
      },
      { status: 500 },
    );
  }
}

// ヘルスチェック用（Cloud Scheduler のHTTPターゲット設定確認）
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/batch/daily',
    method: 'POST',
    description: '日次バッチ（MF取り込み + 催促通知）',
  });
}
