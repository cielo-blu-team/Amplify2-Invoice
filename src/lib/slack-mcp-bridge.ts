// Slackメッセージ → MCPツール呼び出しブリッジ（3A-06）
export interface ParsedSlackCommand {
  tool: string;
  args: Record<string, unknown>;
}

export function parseSlackMessage(text: string): ParsedSlackCommand | null {
  // コマンドパターン: "見積作成 取引先: ABC 件名: テスト"
  if (text.includes('見積作成') || text.includes('estimate')) {
    return { tool: 'create-estimate', args: {} };
  }
  if (text.includes('請求作成') || text.includes('invoice')) {
    return { tool: 'create-invoice', args: {} };
  }
  if (text.includes('一覧') || text.includes('list')) {
    return { tool: 'list-documents', args: {} };
  }
  return null;
}

export async function invokeMcpTool(
  tool: string,
  args: Record<string, unknown>,
  token: string
): Promise<unknown> {
  // MCP HTTPサーバーへの橋渡し（本番実装時に差し替え）
  const baseUrl = process.env.MCP_SERVER_URL ?? 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/tools/${tool}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(args),
  });
  return res.json();
}
