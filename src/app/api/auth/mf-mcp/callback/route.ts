import { NextResponse } from 'next/server';
import { finishMcpAuth } from '@/lib/mf-mcp-client';

/**
 * MF MCP OAuth コールバック
 * GET /api/auth/mf-mcp/callback?code=xxx
 *
 * MF 認可サーバーからの認可コードを受け取り、
 * MCP SDK の finishAuth() でトークン交換を行う。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    const desc = searchParams.get('error_description') ?? error;
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    const baseUrl = host
      ? `${proto}://${host}`
      : 'https://courage-invoice-649548596161.asia-northeast1.run.app';
    return NextResponse.redirect(
      `${baseUrl}/settings?mf_mcp_error=${encodeURIComponent(desc)}`,
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: '認可コードがありません' },
      { status: 400 },
    );
  }

  try {
    await finishMcpAuth(code);

    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    const baseUrl = host
      ? `${proto}://${host}`
      : 'https://courage-invoice-649548596161.asia-northeast1.run.app';

    return NextResponse.redirect(`${baseUrl}/settings?mf_mcp_connected=1`);
  } catch (e) {
    console.error('[MF MCP callback] トークン交換失敗:', e);
    return NextResponse.json(
      { error: `トークン交換エラー: ${String(e)}` },
      { status: 500 },
    );
  }
}
