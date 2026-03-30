import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin-auth';

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

  try {
    await verifyIdToken(idToken);
  } catch (e) {
    console.error('[google] token verification failed:', e);
    return NextResponse.json({ error: '認証トークンが無効です' }, { status: 401 });
  }

  // Firebase ID token の有効期限は1時間
  const expiresIn = 3600;

  const res = NextResponse.json({ success: true });
  res.cookies.set('firebase-id-token', idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: expiresIn,
    sameSite: 'lax',
  });
  return res;
}
