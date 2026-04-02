export const dynamic = 'force-dynamic';

/**
 * MCP HTTP エンドポイント（claude.ai 接続用）
 *
 * GET/POST/DELETE /api/mcp
 *
 * WebStandardStreamableHTTPServerTransport を使用。
 * ステートレスモード（Cloud Run のスケールアウト対応）で動作。
 * リクエストごとに新しいサーバーインスタンスを作成する。
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import * as tools from '@/lib/mcp-tools';

const SYSTEM_USER_ID = process.env.MCP_SYSTEM_USER_ID ?? 'mcp-system';

function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'courage-invoice', version: '1.0.0' });

  // 見積書作成
  server.registerTool('create_estimate', {
    description: '見積書を新規作成する。取引先名・件名・明細行を指定してdraft状態の見積書を作成し、帳票IDとサマリを返す。',
    inputSchema: tools.createEstimateSchema,
  }, async (args) => {
    const result = await tools.createEstimate(args as Parameters<typeof tools.createEstimate>[0], SYSTEM_USER_ID);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 請求書作成
  server.registerTool('create_invoice', {
    description: '請求書を新規作成する。取引先名・件名・支払期限・明細行を指定してdraft状態の請求書を作成する。',
    inputSchema: tools.createInvoiceSchema,
  }, async (args) => {
    const result = await tools.createInvoice(args as Parameters<typeof tools.createInvoice>[0], SYSTEM_USER_ID);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 見積→請求変換
  server.registerTool('convert_to_invoice', {
    description: '見積書IDと支払期限を指定して請求書に変換する。元の見積書はconfirmed状態になる。',
    inputSchema: tools.convertToInvoiceSchema,
  }, async (args) => {
    const result = await tools.convertToInvoice(args as Parameters<typeof tools.convertToInvoice>[0], SYSTEM_USER_ID);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 帳票取得
  server.registerTool('get_document', {
    description: '帳票IDを指定して見積書または請求書の詳細情報を取得する。',
    inputSchema: tools.getDocumentSchema,
  }, async (args) => {
    const result = await tools.getDocument(args as Parameters<typeof tools.getDocument>[0]);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 帳票一覧
  server.registerTool('list_documents', {
    description: '帳票一覧を取得する。種別・ステータス・取引先名・期間でフィルタリング可。',
    inputSchema: tools.listDocumentsSchema,
  }, async (args) => {
    const result = await tools.listDocuments(args as Parameters<typeof tools.listDocuments>[0]);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 帳票更新
  server.registerTool('update_document', {
    description: 'draft状態の帳票の件名・明細行・備考などを更新する。',
    inputSchema: tools.updateDocumentSchema,
  }, async (args) => {
    const result = await tools.updateDocument(args as Parameters<typeof tools.updateDocument>[0]);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 帳票削除
  server.registerTool('delete_document', {
    description: 'draft状態の帳票を論理削除する。',
    inputSchema: tools.deleteDocumentSchema,
  }, async (args) => {
    const result = await tools.deleteDocument(args as Parameters<typeof tools.deleteDocument>[0]);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // PDF生成
  server.registerTool('generate_pdf', {
    description: '帳票IDを指定してPDFを生成しダウンロードURLを返す。',
    inputSchema: tools.generatePdfSchema,
  }, async (args) => {
    const result = await tools.generatePdf(args as Parameters<typeof tools.generatePdf>[0]);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // ステータス更新
  server.registerTool('update_status', {
    description: '帳票のステータスを遷移させる。',
    inputSchema: tools.updateStatusSchema,
  }, async (args) => {
    const result = await tools.updateStatus(args as Parameters<typeof tools.updateStatus>[0], SYSTEM_USER_ID);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 承認
  server.registerTool('approve_document', {
    description: '帳票を承認または否認する。',
    inputSchema: tools.approveDocumentSchema,
  }, async (args) => {
    const result = await tools.approveDoc(args as Parameters<typeof tools.approveDoc>[0], SYSTEM_USER_ID);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 取引先一覧
  server.registerTool('list_clients', {
    description: '取引先一覧を取得する。名前の部分一致フィルタとページネーション対応。',
    inputSchema: tools.listClientsSchema,
  }, async (args) => {
    const result = await tools.listClients(args as Parameters<typeof tools.listClients>[0]);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 取引先作成
  server.registerTool('create_client', {
    description: '新しい取引先を登録する。名前は必須。',
    inputSchema: tools.createClientSchema,
  }, async (args) => {
    const result = await tools.createClientTool(args as Parameters<typeof tools.createClientTool>[0]);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // 取引先更新
  server.registerTool('update_client', {
    description: '取引先IDを指定して取引先情報を更新する。',
    inputSchema: tools.updateClientSchema,
  }, async (args) => {
    const result = await tools.updateClientTool(args as Parameters<typeof tools.updateClientTool>[0]);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // ダッシュボード
  server.registerTool('get_dashboard', {
    description: '売上・未収・帳票件数などのダッシュボード集計データを取得する。',
    inputSchema: tools.getDashboardSchema,
  }, async (args) => {
    const result = await tools.getDashboard(args as Parameters<typeof tools.getDashboard>[0]);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  return server;
}

async function handler(request: Request): Promise<Response> {
  // ステートレスモード: リクエストごとに新しいトランスポートとサーバーを作成
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(request);
}

// ステートレスモードでは SSE GET は不要（Cloud Run LB が 30s で 504 を返すため）
// 405 を返すことでクライアントは POST only モードにフォールバックする
export async function GET(): Promise<Response> {
  return new Response(null, {
    status: 405,
    headers: { Allow: 'POST' },
  });
}

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return handler(request);
}
