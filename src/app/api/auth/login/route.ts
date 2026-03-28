import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TODO: Cognito Hosted UI 連携実装
  // 現在はモック: メール/パスワードを受け取り、開発用にダミートークンを返す
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'メールアドレスを入力してください' }, { status: 400 });
  }
  // 開発用モック: proxy.ts が確認する Cookie を設定してログイン状態にする
  const res = NextResponse.json({
    success: true,
    message: '開発モード: Cognito統合は準備中です',
    redirectUrl: '/',
  });
  res.cookies.set('amplify-signin-with-hostedui', 'dev-mock-token', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8, // 8時間
  });
  return res;
}
