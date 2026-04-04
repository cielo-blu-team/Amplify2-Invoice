import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/mf-oauth-client';

const PROJECT_ID = process.env.GCP_PROJECT_ID ?? 'courage-invoice-prod';

/**
 * MF会計OAuth コールバック
 * 認可コードを受け取り、トークンを取得してSecret Managerに保存
 * GET /api/auth/mf/callback?code=xxx&state=yyy
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // エラー確認
  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?mf_error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.json({ error: '認可コードがありません' }, { status: 400 });
  }

  // state検証（CSRF対策）
  const cookieHeader = request.headers.get('cookie') ?? '';
  const savedState = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('mf_oauth_state='))
    ?.split('=')[1];

  if (!savedState || savedState !== state) {
    return NextResponse.json({ error: 'stateが一致しません（CSRF検出）' }, { status: 400 });
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
  // Cloud Run 環境では以下コマンドで保存:
  // echo -n "<token>" | gcloud secrets versions add mf-oauth-refresh-token --project=courage-invoice-prod --data-file=-
  console.log('[MF callback] refresh_token 取得成功 - Secret Managerへの保存が必要です');
  console.log('[MF callback] 手動保存コマンド:');
  console.log(`echo -n "${tokens.refresh_token}" | gcloud secrets versions add mf-oauth-refresh-token --project=${PROJECT_ID} --data-file=-`);

  // 成功 → 設定ページへリダイレクト
  const res = NextResponse.redirect(new URL('/settings?mf_connected=1', request.url));
  res.cookies.delete('mf_oauth_state');
  return res;
}
