import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証不要のパス（MCP・Slack エンドポイントは外部から呼ばれるため除外）
const PUBLIC_PATHS = ['/login', '/api/auth', '/api/mcp', '/api/slack', '/.well-known'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // パブリックパスはスキップ
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Firebase ログイン後に設定される httpOnly Cookie で認証を確認
  const token =
    request.cookies.get('firebase-id-token')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
