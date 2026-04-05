import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth-server';
import { authorize } from '@/lib/auth';
import {
  getMcpClient,
  getPendingAuthorizationUrl,
  clearPendingAuthorizationUrl,
} from '@/lib/mf-mcp-client';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';

/**
 * MF MCP OAuth 認可開始
 * GET /api/auth/mf-mcp/start
 *
 * MCP SDK の OAuth フローを開始する。
 * MCP サーバーが 401 を返した場合、SDK が自動で認可URLを生成するため、
 * connect() を呼んで UnauthorizedError をキャッチし、認可URLを返す。
 */
export async function GET() {
  try {
    const role = await getCurrentUserRole();
    authorize(role, 'document:approve');
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  try {
    // 接続を試みる — 認可済みならそのまま成功する
    await getMcpClient();
    return NextResponse.json({
      ok: true,
      message: '既に認可済みです。MCP サーバーに接続できます。',
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      // OAuthProvider.redirectToAuthorization() が呼ばれた後
      const authUrl = getPendingAuthorizationUrl();
      if (authUrl) {
        clearPendingAuthorizationUrl();
        return NextResponse.redirect(authUrl.toString());
      }
      return NextResponse.json(
        { error: '認可URLの生成に失敗しました', detail: String(e) },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: `MCP 接続エラー: ${String(e)}` },
      { status: 500 },
    );
  }
}
