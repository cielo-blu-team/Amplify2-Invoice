import { NextResponse } from 'next/server';
import { verifyIdToken, createSessionCookie } from '@/lib/firebase-admin-auth';
import { provisionUser } from '@/lib/provision-user';

// 7日間
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  let idToken: string;
  try {
    ({ idToken } = await request.json());
  } catch (e) {
    console.error('[google] request.json() failed:', e);
    return NextResponse.json({ error: 'リクエストの解析に失敗しました' }, { status: 400 });
  }

  if (!idToken) {
    return NextResponse.json({ error: 'IDトークンが必要です' }, { status: 400 });
  }

  let decoded: Awaited<ReturnType<typeof verifyIdToken>>;
  try {
    decoded = await verifyIdToken(idToken);
  } catch (e) {
    console.error('[google] token verification failed:', e);
    return NextResponse.json({ error: '認証トークンが無効です' }, { status: 401 });
  }

  // 招待チェック + ユーザープロビジョニング
  const result = await provisionUser(
    decoded.uid,
    decoded.email ?? '',
    decoded.name ?? decoded.email ?? '',
  );

  if (result.status === 'not_invited') {
    return NextResponse.json(
      { error: 'このメールアドレスは招待されていません。管理者にお問い合わせください。' },
      { status: 403 },
    );
  }

  let sessionCookie: string;
  try {
    sessionCookie = await createSessionCookie(idToken, SESSION_DURATION_MS);
  } catch (e) {
    console.error('[google] createSessionCookie failed:', e);
    return NextResponse.json({ error: 'セッションの作成に失敗しました' }, { status: 500 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('firebase-id-token', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
    sameSite: 'lax',
  });
  return res;
}
