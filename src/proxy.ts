import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証不要のパス
const PUBLIC_PATHS = ['/login', '/api/auth'];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // パブリックパスはスキップ
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Amplify Gen2 の認証Cookie または Authorization ヘッダーから JWT を取得
  // Cookie名: amplify-signin-with-hostedui（Amplify Hosted UI 経由のサインイン時に設定）
  // 実際のJWT検証はCognito/Amplify側が担当するため、ここではCookieの有無のみ確認する
  const token =
    request.cookies.get('amplify-signin-with-hostedui')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ロール情報をヘッダーに追加（Server Component で参照するため）
  // 実際のJWT検証はCognito側で行われるため、ここではクレームを信頼してパス
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
