import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { buildAuthorizationUrl } from '@/lib/mf-oauth-client';
import { authorize } from '@/lib/auth';
import { getCurrentUserRole } from '@/lib/auth-server';

/**
 * MF会計OAuth認可フロー開始
 * 管理者のみ実行可能（初回のみ）
 * GET /api/auth/mf/start
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

  // stateをcookieに保存してCSRF対策
  const res = NextResponse.redirect(authUrl);
  res.cookies.set('mf_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10分
    sameSite: 'lax',
    path: '/',
  });
  return res;
}
