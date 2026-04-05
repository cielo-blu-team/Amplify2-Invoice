import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth-server';
import { authorize } from '@/lib/auth';
import { callMcpTool, listMcpTools } from '@/lib/mf-mcp-client';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';

/**
 * MF MCP ツール実行（管理者のみ）
 *
 * GET  /api/mf-mcp/tools — ツール一覧取得
 * POST /api/mf-mcp/tools — ツール実行 { tool: string, args?: object }
 */

export async function GET() {
  try {
    const role = await getCurrentUserRole();
    authorize(role, 'document:approve');
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  try {
    const tools = await listMcpTools();
    return NextResponse.json({ ok: true, tools });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, error: '認可が必要です', action: '/api/auth/mf-mcp/start' },
        { status: 401 },
      );
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const role = await getCurrentUserRole();
    authorize(role, 'document:approve');
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  let body: { tool?: string; args?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストボディが不正です' },
      { status: 400 },
    );
  }

  const { tool, args } = body;
  if (!tool || typeof tool !== 'string') {
    return NextResponse.json(
      { error: 'tool パラメータが必要です' },
      { status: 400 },
    );
  }

  try {
    const result = await callMcpTool(tool, args ?? {});
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, error: '認可が必要です', action: '/api/auth/mf-mcp/start' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 500 },
    );
  }
}
