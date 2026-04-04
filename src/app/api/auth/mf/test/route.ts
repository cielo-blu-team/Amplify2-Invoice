import { NextResponse } from 'next/server';
import { mfAccountingClient } from '@/lib/mf-oauth-client';
import { getCurrentUserRole } from '@/lib/auth-server';
import { authorize } from '@/lib/auth';

/**
 * MF会計API 接続テスト（管理者のみ）
 * GET /api/auth/mf/test
 * 直近1ヶ月の仕訳を最大1ページ取得して返す
 */
export async function GET() {
  try {
    const role = await getCurrentUserRole();
    authorize(role, 'document:approve');
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  const toDate = new Date().toISOString().slice(0, 10);
  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const journals = await mfAccountingClient.getJournals(fromDate, toDate, 1);
    return NextResponse.json({
      ok: true,
      period: { from: fromDate, to: toDate },
      count: journals.length,
      sample: journals.slice(0, 3),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
