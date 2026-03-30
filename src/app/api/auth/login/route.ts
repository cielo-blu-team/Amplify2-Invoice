import { NextResponse } from 'next/server';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY ?? '';
const FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;

function getSignInUrl(): string {
  if (FIREBASE_AUTH_EMULATOR_HOST) {
    return `http://${FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  }
  return `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
}

export async function POST(request: Request) {
  const { email, password } = await request.json();

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

  // Firebase Auth REST API でメール/パスワード認証
  const firebaseRes = await fetch(getSignInUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!firebaseRes.ok) {
    const error = await firebaseRes.json();
    const message = firebaseAuthErrorMessage(error?.error?.message);
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const { idToken, expiresIn } = await firebaseRes.json();

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
