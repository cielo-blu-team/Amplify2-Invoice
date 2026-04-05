import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth-server';
import { authorize } from '@/lib/auth';
import { listMcpTools, getOfficeInfo, getDictionary, closeMcpClient } from '@/lib/mf-mcp-client';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';

/**
 * MF MCP 接続テスト（管理者のみ）
 * GET /api/mf-mcp/test
 *
 * MCP サーバーに接続し、利用可能なツール一覧と事業者情報を取得する。
 */
export async function GET() {
  try {
    const role = await getCurrentUserRole();
    authorize(role, 'document:approve');
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  const results: Record<string, unknown> = {};

  try {
    // 1. ツール一覧を取得
    const tools = await listMcpTools();
    results.tools = {
      count: tools.length,
      names: tools.map((t) => t.name),
      details: tools.map((t) => ({
        name: t.name,
        description: t.description,
      })),
    };

    // 2. 英日辞書を取得（初回呼び出し推奨）
    const dict = await getDictionary();
    results.dictionary = { success: dict.success };

    // 3. 事業者情報を取得
    const officeInfo = await getOfficeInfo();
    results.office = officeInfo;

    return NextResponse.json({ ok: true, ...results });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'MCP サーバーへの認可が必要です',
          action: '/api/auth/mf-mcp/start にアクセスして認可してください',
        },
        { status: 401 },
      );
    }

    // 接続失敗時はクライアントをリセット
    await closeMcpClient();

    return NextResponse.json(
      { ok: false, error: String(e), ...results },
      { status: 500 },
    );
  }
}
