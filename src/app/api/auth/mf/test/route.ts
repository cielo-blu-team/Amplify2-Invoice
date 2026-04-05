import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/mf-oauth-client';
import { getCurrentUserRole } from '@/lib/auth-server';
import { authorize } from '@/lib/auth';

const MF_ACCOUNTING_BASE = 'https://api-enterprise-accounting.moneyforward.com/api/v3';

/**
 * MF会計Plus API 接続テスト（管理者のみ）
 * GET /api/auth/mf/test
 * 仕訳一覧を1ページ取得してレスポンス構造を返す
 */
export async function GET() {
  try {
    const role = await getCurrentUserRole();
    authorize(role, 'document:approve');
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  try {
    const token = await getAccessToken();

    // 仕訳一覧を取得
    const journalsRes = await fetch(`${MF_ACCOUNTING_BASE}/journals`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const journalsStatus = journalsRes.status;
    const journalsBody = await journalsRes.text();

    return NextResponse.json({
      ok: journalsRes.ok,
      token_obtained: true,
      journals_endpoint: `${MF_ACCOUNTING_BASE}/journals`,
      journals_status: journalsStatus,
      journals_response: (() => {
        try { return JSON.parse(journalsBody); }
        catch { return journalsBody.slice(0, 500); }
      })(),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
