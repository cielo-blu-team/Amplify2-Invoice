// Slackメッセージ → MCPツール呼び出しブリッジ

export interface ParsedSlackCommand {
  tool: string;
  args: Record<string, unknown>;
  replyHint?: string; // ユーザーへの確認メッセージ
}

/**
 * Slackメッセージテキストをパースして MCP ツール呼び出しに変換する。
 *
 * 対応フォーマット:
 *   見積作成 取引先:ABC株式会社 件名:Webサイト制作
 *   請求作成 取引先:ABC 件名:月次保守 金額:50000
 *   一覧 / 請求書一覧 / 見積書一覧
 *   ステータス INV-20260301-001
 *   承認待ち一覧
 *   ヘルプ
 */
export function parseSlackMessage(text: string): ParsedSlackCommand | null {
  const normalized = text.trim().replace(/\s+/g, ' ');

  // --- ヘルプ ---
  if (/^ヘルプ$|^help$/i.test(normalized)) {
    return {
      tool: 'help',
      args: {},
      replyHint: [
        '使えるコマンド一覧:',
        '• `見積作成 取引先:〇〇 件名:〇〇` — 見積書を新規作成',
        '• `請求作成 取引先:〇〇 件名:〇〇 金額:〇〇` — 請求書を新規作成',
        '• `一覧` / `請求書一覧` / `見積書一覧` — 帳票一覧を表示',
        '• `承認待ち一覧` — 承認待ち帳票を表示',
        '• `ステータス [帳票番号]` — 帳票の状態を確認',
      ].join('\n'),
    };
  }

  // --- 承認待ち一覧 ---
  if (/承認待ち/.test(normalized)) {
    return { tool: 'list-documents', args: { status: 'pending_approval' } };
  }

  // --- 一覧 ---
  if (/^一覧$/.test(normalized)) {
    return { tool: 'list-documents', args: {} };
  }
  if (/請求書一覧/.test(normalized)) {
    return { tool: 'list-documents', args: { documentType: 'invoice' } };
  }
  if (/見積書一覧|見積一覧/.test(normalized)) {
    return { tool: 'list-documents', args: { documentType: 'estimate' } };
  }

  // --- ステータス確認 ---
  const statusMatch = normalized.match(/^ステータス\s+([\w-]+)/);
  if (statusMatch) {
    return { tool: 'get-document', args: { documentNumber: statusMatch[1] } };
  }

  // --- 見積作成 ---
  if (/見積作成|見積書作成/.test(normalized)) {
    return {
      tool: 'create-estimate',
      args: extractDocumentArgs(normalized),
    };
  }

  // --- 請求作成 ---
  if (/請求作成|請求書作成/.test(normalized)) {
    return {
      tool: 'create-invoice',
      args: extractDocumentArgs(normalized),
    };
  }

  return null;
}

/**
 * "取引先:〇〇 件名:〇〇 金額:〇〇" 形式のパラメータを抽出する
 */
function extractDocumentArgs(text: string): Record<string, unknown> {
  const args: Record<string, unknown> = {};

  const clientMatch = text.match(/取引先[:：]\s*([^\s　]+)/);
  if (clientMatch) args.clientName = clientMatch[1];

  const subjectMatch = text.match(/件名[:：]\s*([^\s　取金]+(?:\s+[^取金\s][^\s　]*)*)/);
  if (subjectMatch) args.subject = subjectMatch[1].trim();

  const amountMatch = text.match(/金額[:：]\s*([\d,，]+)/);
  if (amountMatch) args.amount = parseInt(amountMatch[1].replace(/[,，]/g, ''), 10);

  const dueDateMatch = text.match(/期限[:：]\s*([\d/-]+)/);
  if (dueDateMatch) args.dueDate = dueDateMatch[1];

  return args;
}

/**
 * MCP HTTP サーバーにツール呼び出しをリクエストする
 */
export async function invokeMcpTool(
  tool: string,
  args: Record<string, unknown>,
  token: string,
): Promise<unknown> {
  // MCP_SERVER_URL: Cloud Run の Next.js アプリ URL（末尾スラッシュなし）
  // 例: https://courage-invoice-xxx.run.app
  const baseUrl = process.env.MCP_SERVER_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/mcp/tools/${tool}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`MCP tool ${tool} failed: ${res.status}`);
  }
  return res.json();
}
