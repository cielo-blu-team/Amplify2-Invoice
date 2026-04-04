import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { buildAuthorizationUrl } from '@/lib/mf-oauth-client';
import { authorize } from '@/lib/auth';
import { getCurrentUserRole } from '@/lib/auth-server';

/**
 * MF会計OAuth認可フロー開始
 * 管理者のみ実行可能（初回のみ）
 * GET /api/auth/mf/start
 * → { url: string } を返すので、クライアント側でリダイレクト
 */
export async function GET() {
  try {
    const role = await getCurrentUserRole();
    authorize(role, 'document:approve'); // admin のみ
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  const state = randomBytes(16).toString('hex');
  const authUrl = buildAuthorizationUrl(state);

  // next/headers の cookies() で確実に Set-Cookie ヘッダーを送出
  const cookieStore = await cookies();
  cookieStore.set('mf_oauth_state', state, {
    httpOnly: true,
    secure: true,
    maxAge: 600,
    sameSite: 'none',
    path: '/',
  });

  return NextResponse.json({ url: authUrl });
}
