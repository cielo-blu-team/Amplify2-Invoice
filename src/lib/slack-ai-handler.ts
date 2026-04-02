/**
 * Claude AI を使った Slack 会話型ハンドラ
 * - 会話履歴をメモリ内に保持（チャンネル・ユーザーごと）
 * - Claude がツール呼び出し判断と質問生成を行う
 */
import Anthropic from '@anthropic-ai/sdk';
import * as tools from '@/lib/mcp-tools';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SYSTEM_USER_ID = process.env.MCP_SYSTEM_USER_ID ?? 'mcp-slack-bot';

// ────────────────────────────────────────────────────────────────
// 会話履歴（チャンネルID または userID をキーに保持）
// ────────────────────────────────────────────────────────────────

interface ConversationEntry {
  messages: Anthropic.MessageParam[];
  lastActivity: number;
}

const conversations = new Map<string, ConversationEntry>();
const CONVERSATION_TTL_MS = 30 * 60 * 1000; // 30分で会話リセット

function getConversation(key: string): Anthropic.MessageParam[] {
  const entry = conversations.get(key);
  if (!entry) return [];
  if (Date.now() - entry.lastActivity > CONVERSATION_TTL_MS) {
    conversations.delete(key);
    return [];
  }
  return entry.messages;
}

function saveConversation(key: string, messages: Anthropic.MessageParam[]) {
  conversations.set(key, { messages, lastActivity: Date.now() });
}

// ────────────────────────────────────────────────────────────────
// Claude ツール定義
// ────────────────────────────────────────────────────────────────

const claudeTools: Anthropic.Tool[] = [
  {
    name: 'create_estimate',
    description: '見積書を新規作成する。取引先名・件名・明細行が揃ったら呼び出す。',
    input_schema: {
      type: 'object',
      properties: {
        clientName: { type: 'string', description: '取引先名' },
        subject: { type: 'string', description: '件名' },
        issueDate: { type: 'string', description: '発行日 YYYY-MM-DD（省略時は今日）' },
        validUntil: { type: 'string', description: '有効期限 YYYY-MM-DD（任意）' },
        lineItems: {
          type: 'array',
          description: '明細行',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' },
              taxRate: { type: 'number', enum: [10, 8, 0] },
            },
            required: ['description', 'quantity', 'unitPrice', 'taxRate'],
          },
        },
        notes: { type: 'string', description: '備考（任意）' },
      },
      required: ['clientName', 'subject', 'lineItems'],
    },
  },
  {
    name: 'create_invoice',
    description: '請求書を新規作成する。取引先名・件名・支払期限・明細行が揃ったら呼び出す。',
    input_schema: {
      type: 'object',
      properties: {
        clientName: { type: 'string', description: '取引先名' },
        subject: { type: 'string', description: '件名' },
        issueDate: { type: 'string', description: '発行日 YYYY-MM-DD（省略時は今日）' },
        dueDate: { type: 'string', description: '支払期限 YYYY-MM-DD' },
        lineItems: {
          type: 'array',
          description: '明細行',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' },
              taxRate: { type: 'number', enum: [10, 8, 0] },
            },
            required: ['description', 'quantity', 'unitPrice', 'taxRate'],
          },
        },
        notes: { type: 'string', description: '備考（任意）' },
      },
      required: ['clientName', 'subject', 'dueDate', 'lineItems'],
    },
  },
  {
    name: 'list_documents',
    description: '見積書・請求書の一覧を取得する。',
    input_schema: {
      type: 'object',
      properties: {
        documentType: { type: 'string', enum: ['estimate', 'invoice'], description: '帳票種別' },
        status: { type: 'string', description: 'ステータスフィルタ（カンマ区切り）' },
        clientName: { type: 'string', description: '取引先名（部分一致）' },
        limit: { type: 'number', description: '取得件数（最大20）' },
      },
    },
  },
  {
    name: 'get_document',
    description: '帳票IDを指定して見積書または請求書の詳細を取得する。',
    input_schema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: '帳票ID' },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'approve_document',
    description: '帳票を承認または否認する。',
    input_schema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: '帳票ID' },
        action: { type: 'string', enum: ['approve', 'reject'], description: '承認 or 否認' },
        comment: { type: 'string', description: 'コメント（否認時は必須）' },
      },
      required: ['documentId', 'action'],
    },
  },
  {
    name: 'update_status',
    description: '帳票のステータスを変更する（送付・キャンセルなど）。',
    input_schema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: '帳票ID' },
        newStatus: {
          type: 'string',
          enum: ['draft', 'pending_approval', 'approved', 'rejected', 'confirmed', 'sent', 'paid', 'cancelled'],
          description: '新しいステータス',
        },
        comment: { type: 'string', description: 'コメント（任意）' },
      },
      required: ['documentId', 'newStatus'],
    },
  },
  {
    name: 'list_clients',
    description: '取引先一覧を取得する。',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '取引先名フィルタ（部分一致）' },
      },
    },
  },
];

// ────────────────────────────────────────────────────────────────
// ツール実行
// ────────────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    let result: unknown;
    switch (name) {
      case 'create_estimate':
        result = await tools.createEstimate(input as Parameters<typeof tools.createEstimate>[0], SYSTEM_USER_ID);
        break;
      case 'create_invoice':
        result = await tools.createInvoice(input as Parameters<typeof tools.createInvoice>[0], SYSTEM_USER_ID);
        break;
      case 'list_documents':
        result = await tools.listDocuments(input as Parameters<typeof tools.listDocuments>[0]);
        break;
      case 'get_document':
        result = await tools.getDocument(input as Parameters<typeof tools.getDocument>[0]);
        break;
      case 'approve_document':
        result = await tools.approveDoc(input as Parameters<typeof tools.approveDoc>[0], SYSTEM_USER_ID);
        break;
      case 'update_status':
        result = await tools.updateStatus(input as Parameters<typeof tools.updateStatus>[0], SYSTEM_USER_ID);
        break;
      case 'list_clients':
        result = await tools.listClients(input as Parameters<typeof tools.listClients>[0]);
        break;
      default:
        return `未知のツール: ${name}`;
    }
    return JSON.stringify(result);
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : String(e) });
  }
}

// ────────────────────────────────────────────────────────────────
// メイン: Slack メッセージを受けて Claude と対話
// ────────────────────────────────────────────────────────────────

export async function handleSlackMessage(
  conversationKey: string,
  userMessage: string,
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const history = getConversation(conversationKey);

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  let response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `あなたは帳票管理システム「Courage Invoice」のアシスタントです。
ユーザーが見積書・請求書の作成や確認・承認をSlack上で自然に行えるようサポートします。

今日の日付: ${today}

## 振る舞い
- 日本語で丁寧かつ簡潔に応答する
- 帳票作成に必要な情報が不足している場合は、一度に1〜2項目ずつ質問する
- 情報が揃ったらすぐにツールを呼び出す
- ツール実行結果はユーザーに分かりやすく伝える
- 作成した帳票番号・金額・宛先を必ず明示する

## 明細の扱い
- 「50万円」「50,000円」などの金額表現を適切に解釈する
- 数量・単価が曖昧な場合は確認する
- 消費税率は特に指定がなければ10%を使用する

## 対応できること
- 見積書の作成・確認
- 請求書の作成・確認
- 帳票一覧の表示
- 承認・否認
- ステータス変更（送付済みにするなど）
- 取引先検索`,
    tools: claudeTools,
    messages,
  });

  // ツール呼び出しループ
  while (response.stop_reason === 'tool_use') {
    const assistantMessage: Anthropic.MessageParam = {
      role: 'assistant',
      content: response.content,
    };
    messages.push(assistantMessage);

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const toolResult = await executeTool(block.name, block.input as Record<string, unknown>);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: toolResult,
        });
      }
    }

    messages.push({ role: 'user', content: toolResults });

    response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `あなたは帳票管理システム「Courage Invoice」のアシスタントです。
ユーザーが見積書・請求書の作成や確認・承認をSlack上で自然に行えるようサポートします。

今日の日付: ${today}

## 振る舞い
- 日本語で丁寧かつ簡潔に応答する
- 帳票作成に必要な情報が不足している場合は、一度に1〜2項目ずつ質問する
- 情報が揃ったらすぐにツールを呼び出す
- ツール実行結果はユーザーに分かりやすく伝える
- 作成した帳票番号・金額・宛先を必ず明示する

## 明細の扱い
- 「50万円」「50,000円」などの金額表現を適切に解釈する
- 数量・単価が曖昧な場合は確認する
- 消費税率は特に指定がなければ10%を使用する

## 対応できること
- 見積書の作成・確認
- 請求書の作成・確認
- 帳票一覧の表示
- 承認・否認
- ステータス変更（送付済みにするなど）
- 取引先検索`,
      tools: claudeTools,
      messages,
    });
  }

  // 最終テキストを取り出す
  const replyText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  // 会話履歴を保存（最大20ターン保持）
  messages.push({ role: 'assistant', content: response.content });
  const trimmed = messages.slice(-40); // 直近20往復
  saveConversation(conversationKey, trimmed);

  return replyText || 'ご用件をお聞かせください。';
}
