import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin-auth';
import { provisionUser } from '@/lib/provision-user';

const FIREBASE_API_KEY = (process.env.FIREBASE_API_KEY ?? '').trim();
const FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;

function getSignInUrl(): string {
  if (FIREBASE_AUTH_EMULATOR_HOST) {
    return `http://${FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  }
  return `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
}

export async function POST(request: Request) {
  let email: string, password: string;
  try {
    ({ email, password } = await request.json());
  } catch (e) {
    console.error('[login] request.json() failed:', e);
    return NextResponse.json({ error: 'リクエストの解析に失敗しました' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: 'メールアドレスとパスワードを入力してください' },
      { status: 400 },
    );
  }

  if (!FIREBASE_API_KEY) {
    return NextResponse.json(
      { error: 'サーバー設定エラー: FIREBASE_API_KEY が未設定です' },
      { status: 500 },
    );
  }

  let firebaseRes: Response;
  try {
    firebaseRes = await fetch(getSignInUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
  } catch (e) {
    console.error('[login] Firebase fetch failed:', e);
    return NextResponse.json({ error: 'Firebase への接続に失敗しました' }, { status: 500 });
  }

  const rawBody = await firebaseRes.text();

  if (!firebaseRes.ok) {
    let errorCode: string | undefined;
    try {
      const errorJson = JSON.parse(rawBody);
      errorCode = errorJson?.error?.message;
    } catch (e) {
      console.error('[login] Firebase error response is not JSON:', rawBody.slice(0, 200), e);
    }
    return NextResponse.json({ error: firebaseAuthErrorMessage(errorCode) }, { status: 401 });
  }

  let idToken: string, expiresIn: string;
  try {
    ({ idToken, expiresIn } = JSON.parse(rawBody));
  } catch (e) {
    console.error('[login] Firebase success response is not JSON:', rawBody.slice(0, 200), e);
    return NextResponse.json({ error: '認証レスポンスの解析に失敗しました' }, { status: 500 });
  }

  // 招待チェック + ユーザープロビジョニング
  let decoded: Awaited<ReturnType<typeof verifyIdToken>>;
  try {
    decoded = await verifyIdToken(idToken);
  } catch (e) {
    console.error('[login] token verification failed:', e);
    return NextResponse.json({ error: '認証トークンの検証に失敗しました' }, { status: 500 });
  }

  const result = await provisionUser(
    decoded.uid,
    decoded.email ?? email,
    decoded.name ?? email,
  );

  if (result.status === 'not_invited') {
    return NextResponse.json(
      { error: 'このメールアドレスは招待されていません。管理者にお問い合わせください。' },
      { status: 403 },
    );
  }

  const res = NextResponse.json({ success: true, redirectUrl: '/' });
  res.cookies.set('firebase-id-token', idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: parseInt(expiresIn, 10),
    sameSite: 'lax',
  });
  return res;
}

function firebaseAuthErrorMessage(code?: string): string {
  switch (code) {
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
      return 'メールアドレスまたはパスワードが正しくありません';
    case 'USER_DISABLED':
      return 'このアカウントは無効化されています';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'ログイン試行回数が多すぎます。しばらくしてから再試行してください';
    default:
      return '認証に失敗しました。再試行してください';
  }
}
