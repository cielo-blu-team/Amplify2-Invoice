import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/mf-oauth-client';
import { getCurrentUserRole } from '@/lib/auth-server';
import { authorize } from '@/lib/auth';

/**
 * MF会計 API 接続テスト（管理者のみ）
 * GET /api/auth/mf/test
 *
 * 以下のエンドポイントを順番に呼び出して接続状況を確認:
 * 1. /v2/tenant — 事業者情報（全プラン共通）
 * 2. biz-admin API — 利用中サービス一覧
 * 3. enterprise-accounting API — 仕訳一覧（会計Plus）
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
    const results: Record<string, unknown> = { token_obtained: true };

    // 1. 事業者情報の取得（全プラン共通 — スコープ: mfc/admin/tenant.read）
    const tenantRes = await fetch('https://api.biz.moneyforward.com/v2/tenant', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    results.tenant = {
      status: tenantRes.status,
      response: await safeParseJson(tenantRes),
    };

    // 2. 利用中サービス一覧（スコープ: mfc/biz-admin/tenant.service.read）
    const servicesRes = await fetch('https://api.biz-admin.moneyforward.com/v1/tenant/active_services', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    results.active_services = {
      status: servicesRes.status,
      response: await safeParseJson(servicesRes),
    };

    // 3. 会計Plus API — 仕訳一覧（スコープ: mfc/enterprise-accounting/journal.read）
    const journalsRes = await fetch('https://api-enterprise-accounting.moneyforward.com/api/v3/journals', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    results.enterprise_accounting = {
      status: journalsRes.status,
      response: await safeParseJson(journalsRes),
    };

    const ok = tenantRes.ok;
    return NextResponse.json({ ok, ...results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

async function safeParseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text.slice(0, 500);
  }
}
