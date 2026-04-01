export const dynamic = 'force-dynamic';

/**
 * MCP ツール REST エンドポイント（Slack ブリッジ用）
 *
 * POST /api/mcp/tools/[tool]
 *   Body: { ...args }
 *   Authorization: Bearer <token>  （任意）
 *
 * slack-mcp-bridge.ts の invokeMcpTool が呼び出す。
 * MCP_SERVER_URL を Cloud Run の URL に設定し、パスを /api/mcp/tools に変更。
 */
import { NextRequest, NextResponse } from 'next/server';
import * as tools from '@/lib/mcp-tools';

const SYSTEM_USER_ID = process.env.MCP_SYSTEM_USER_ID ?? 'mcp-system';

type RouteContext = { params: Promise<{ tool: string }> };

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { tool } = await context.params;
  let args: Record<string, unknown> = {};

  try {
    const text = await request.text();
    if (text) args = JSON.parse(text);
  } catch {
    // body なし or 非 JSON は空引数として処理
  }

  try {
    const result = await dispatchTool(tool, args);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'ツール実行エラー';
    console.error(`[MCP tools] ${tool} error:`, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function dispatchTool(tool: string, args: Record<string, unknown>): Promise<unknown> {
  switch (tool) {
    case 'create_estimate':
    case 'create-estimate':
      return tools.createEstimate(args as Parameters<typeof tools.createEstimate>[0], SYSTEM_USER_ID);

    case 'create_invoice':
    case 'create-invoice':
      return tools.createInvoice(args as Parameters<typeof tools.createInvoice>[0], SYSTEM_USER_ID);

    case 'convert_to_invoice':
    case 'convert-to-invoice':
      return tools.convertToInvoice(args as Parameters<typeof tools.convertToInvoice>[0], SYSTEM_USER_ID);

    case 'get_document':
    case 'get-document':
      return tools.getDocument(args as Parameters<typeof tools.getDocument>[0]);

    case 'list_documents':
    case 'list-documents':
      return tools.listDocuments(args as Parameters<typeof tools.listDocuments>[0]);

    case 'update_document':
    case 'update-document':
      return tools.updateDocument(args as Parameters<typeof tools.updateDocument>[0]);

    case 'delete_document':
    case 'delete-document':
      return tools.deleteDocument(args as Parameters<typeof tools.deleteDocument>[0]);

    case 'generate_pdf':
    case 'generate-pdf':
      return tools.generatePdf(args as Parameters<typeof tools.generatePdf>[0]);

    case 'update_status':
    case 'update-status':
      return tools.updateStatus(args as Parameters<typeof tools.updateStatus>[0], SYSTEM_USER_ID);

    case 'approve_document':
    case 'approve-document':
      return tools.approveDoc(args as Parameters<typeof tools.approveDoc>[0], SYSTEM_USER_ID);

    case 'list_clients':
    case 'list-clients':
      return tools.listClients(args as Parameters<typeof tools.listClients>[0]);

    case 'create_client':
    case 'create-client':
      return tools.createClientTool(args as Parameters<typeof tools.createClientTool>[0]);

    case 'update_client':
    case 'update-client':
      return tools.updateClientTool(args as Parameters<typeof tools.updateClientTool>[0]);

    case 'get_dashboard':
    case 'get-dashboard':
      return tools.getDashboard(args as Parameters<typeof tools.getDashboard>[0]);

    default:
      throw new Error(`未知のツール: ${tool}`);
  }
}
