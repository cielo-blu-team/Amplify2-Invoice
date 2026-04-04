import { NextResponse } from 'next/server';
import { randomBytes, createHmac } from 'crypto';
import { buildAuthorizationUrl } from '@/lib/mf-oauth-client';
import { authorize } from '@/lib/auth';
import { getCurrentUserRole } from '@/lib/auth-server';

/**
 * MF会計OAuth認可フロー開始
 * 管理者のみ実行可能（初回のみ）
 * GET /api/auth/mf/start
 * → { url: string } を返すので、クライアント側でリダイレクト
 *
 * state は HMAC 署名付きトークン形式: <random>.<timestamp>.<hmac>
 * Cookie 不要でコールバック側で署名検証できる
 */
export async function GET() {
  try {
    const role = await getCurrentUserRole();
    authorize(role, 'document:approve'); // admin のみ
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  const random = randomBytes(8).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${random}.${timestamp}`;
  const secret = process.env.MF_OAUTH_CLIENT_SECRET ?? 'dev-secret';
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  const state = `${payload}.${sig}`;

  const authUrl = buildAuthorizationUrl(state);
  return NextResponse.json({ url: authUrl });
}
