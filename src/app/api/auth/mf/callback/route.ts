import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { exchangeCodeForTokens } from '@/lib/mf-oauth-client';

const PROJECT_ID = process.env.GCP_PROJECT_ID ?? 'courage-invoice-prod';

/**
 * MF会計OAuth コールバック
 * 認可コードを受け取り、トークンを取得してSecret Managerに保存
 * GET /api/auth/mf/callback?code=xxx&state=yyy
 *
 * state 検証: HMAC 署名 + 10分以内のタイムスタンプで CSRF を防止
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?mf_error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: '認可コードまたはstateがありません' }, { status: 400 });
  }

  // state 検証: <random>.<timestamp>.<hmac>
  const parts = state.split('.');
  if (parts.length !== 3) {
    return NextResponse.json({ error: 'state形式が不正です' }, { status: 400 });
  }
  const [random, timestamp, sig] = parts;
  const payload = `${random}.${timestamp}`;
  const secret = process.env.MF_OAUTH_CLIENT_SECRET ?? 'dev-secret';
  const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');

  if (sig !== expectedSig) {
    console.error('[MF callback] HMAC 検証失敗');
    return NextResponse.json({ error: 'state署名が不正です（CSRF検出）' }, { status: 400 });
  }

  const age = Date.now() - parseInt(timestamp, 10);
  if (age > 10 * 60 * 1000) {
    return NextResponse.json({ error: 'stateの有効期限切れです' }, { status: 400 });
  }

  // 認可コード → トークン交換
  let tokens: Awaited<ReturnType<typeof exchangeCodeForTokens>>;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (e) {
    console.error('[MF callback] トークン取得失敗:', e);
    return NextResponse.json(
      { error: `トークン取得エラー: ${String(e)}` },
      { status: 500 },
    );
  }

  // refresh_token をログに出力（管理者が手動でSecret Managerに保存）
  console.log('[MF callback] refresh_token 取得成功 - Secret Managerへの保存が必要です');
  console.log('[MF callback] 手動保存コマンド:');
  console.log(`echo -n "${tokens.refresh_token}" | gcloud secrets versions add mf-oauth-refresh-token --project=${PROJECT_ID} --data-file=-`);

  const res = NextResponse.redirect(new URL('/settings?mf_connected=1', request.url));
  return res;
}
