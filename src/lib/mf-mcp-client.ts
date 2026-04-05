/**
 * マネーフォワード クラウド会計 MCP クライアント
 *
 * MF公式MCPサーバー経由でクラウド会計（通常プラン）の仕訳・マスタ・帳票にアクセスする。
 * 会計Plus（REST API）は不要。
 *
 * MCP Server URL: https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3
 *
 * 利用可能な操作:
 *   - 事業者情報取得
 *   - 仕訳: 一覧取得・個別取得・新規作成・更新
 *   - 帳票: 残高試算表・推移表
 *   - マスタ: 勘定科目・補助科目・取引先・部門・税区分（取得のみ）
 *   - 入出金明細の作成
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MF_MCP_SERVER_URL = 'https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3';

// ── 型定義 ────────────────────────────────────────────────────────────────────

/** MCP callTool の結果から text content を抽出した型 */
export interface MFMcpResult {
  success: boolean;
  data: unknown;
  error?: string;
}

/** MCP サーバーのツール情報 */
export interface MFMcpToolInfo {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

// ── OAuth プロバイダー（MCP SDK 用）────────────────────────────────────────────

/**
 * MF MCP サーバー用の OAuthClientProvider 実装
 *
 * サーバーサイド（Cloud Run）で動作するため、ブラウザリダイレクトは使わず
 * トークンの保存/取得を Secret Manager + メモリキャッシュで行う。
 *
 * 初回認可は /api/auth/mf-mcp/start → /api/auth/mf-mcp/callback で行い、
 * 以降は保存済みトークンで自動更新する。
 */
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type { OAuthClientMetadata, OAuthClientInformationMixed, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';

// メモリキャッシュ
let cachedTokens: OAuthTokens | undefined;
let cachedCodeVerifier: string | undefined;
let cachedClientInfo: OAuthClientInformationMixed | undefined;

const MF_MCP_REDIRECT_URI =
  process.env.NODE_ENV === 'production'
    ? 'https://courage-invoice-649548596161.asia-northeast1.run.app/api/auth/mf-mcp/callback'
    : 'http://localhost:3000/api/auth/mf-mcp/callback';

/**
 * Secret Manager からトークンを読み込む
 */
async function loadTokensFromSecretManager(): Promise<OAuthTokens | undefined> {
  const projectId = process.env.GCP_PROJECT_ID ?? 'courage-invoice-prod';
  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/mf-mcp-oauth-tokens/versions/latest`,
    });
    const payload = version.payload?.data;
    if (payload) {
      const str = typeof payload === 'string' ? payload : Buffer.from(payload).toString('utf8');
      return JSON.parse(str) as OAuthTokens;
    }
  } catch (e) {
    console.warn('[MF MCP] Secret Manager からトークン読み込み失敗:', e);
  }
  return undefined;
}

/**
 * Secret Manager にトークンを保存する
 */
async function saveTokensToSecretManager(tokens: OAuthTokens): Promise<void> {
  const projectId = process.env.GCP_PROJECT_ID ?? 'courage-invoice-prod';
  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const parent = `projects/${projectId}/secrets/mf-mcp-oauth-tokens`;

    // シークレットが存在しない場合は作成
    try {
      await client.getSecret({ name: parent });
    } catch {
      await client.createSecret({
        parent: `projects/${projectId}`,
        secretId: 'mf-mcp-oauth-tokens',
        secret: { replication: { automatic: {} } },
      });
    }

    await client.addSecretVersion({
      parent,
      payload: { data: Buffer.from(JSON.stringify(tokens)) },
    });
    console.log('[MF MCP] トークンを Secret Manager に保存しました');
  } catch (e) {
    console.error('[MF MCP] トークンの Secret Manager 保存に失敗:', e);
  }
}

/**
 * Secret Manager からクライアント情報を読み込む
 */
async function loadClientInfoFromSecretManager(): Promise<OAuthClientInformationMixed | undefined> {
  const projectId = process.env.GCP_PROJECT_ID ?? 'courage-invoice-prod';
  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/mf-mcp-client-info/versions/latest`,
    });
    const payload = version.payload?.data;
    if (payload) {
      const str = typeof payload === 'string' ? payload : Buffer.from(payload).toString('utf8');
      return JSON.parse(str) as OAuthClientInformationMixed;
    }
  } catch {
    // 初回は存在しない
  }
  return undefined;
}

/**
 * Secret Manager にクライアント情報を保存する
 */
async function saveClientInfoToSecretManager(info: OAuthClientInformationMixed): Promise<void> {
  const projectId = process.env.GCP_PROJECT_ID ?? 'courage-invoice-prod';
  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const parent = `projects/${projectId}/secrets/mf-mcp-client-info`;

    try {
      await client.getSecret({ name: parent });
    } catch {
      await client.createSecret({
        parent: `projects/${projectId}`,
        secretId: 'mf-mcp-client-info',
        secret: { replication: { automatic: {} } },
      });
    }

    await client.addSecretVersion({
      parent,
      payload: { data: Buffer.from(JSON.stringify(info)) },
    });
    console.log('[MF MCP] クライアント情報を Secret Manager に保存しました');
  } catch (e) {
    console.error('[MF MCP] クライアント情報の Secret Manager 保存に失敗:', e);
  }
}

// 認可URL一時保存（認可フロー中に使用）
let pendingAuthorizationUrl: URL | undefined;

export function getPendingAuthorizationUrl(): URL | undefined {
  return pendingAuthorizationUrl;
}

export function clearPendingAuthorizationUrl(): void {
  pendingAuthorizationUrl = undefined;
}

/**
 * MF MCP 用 OAuthClientProvider
 */
class MFMcpOAuthProvider implements OAuthClientProvider {
  get redirectUrl(): string {
    return MF_MCP_REDIRECT_URI;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: 'Courage Invoice',
      redirect_uris: [MF_MCP_REDIRECT_URI],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic',
    };
  }

  async clientInformation(): Promise<OAuthClientInformationMixed | undefined> {
    if (cachedClientInfo) return cachedClientInfo;
    cachedClientInfo = await loadClientInfoFromSecretManager();
    return cachedClientInfo;
  }

  async saveClientInformation(info: OAuthClientInformationMixed): Promise<void> {
    cachedClientInfo = info;
    await saveClientInfoToSecretManager(info);
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    if (cachedTokens) return cachedTokens;
    cachedTokens = await loadTokensFromSecretManager();
    return cachedTokens;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    cachedTokens = tokens;
    await saveTokensToSecretManager(tokens);
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    // サーバーサイドではリダイレクトできないため、URLを保存して API で返す
    pendingAuthorizationUrl = authorizationUrl;
    console.log('[MF MCP] 認可が必要です。以下のURLで認可してください:');
    console.log(authorizationUrl.toString());
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    cachedCodeVerifier = codeVerifier;
  }

  async codeVerifier(): Promise<string> {
    return cachedCodeVerifier ?? '';
  }
}

// ── MCP クライアント管理 ─────────────────────────────────────────────────────

let mcpClient: Client | undefined;
let mcpTransport: StreamableHTTPClientTransport | undefined;

const oauthProvider = new MFMcpOAuthProvider();

/** OAuthProvider を外部から利用するためのエクスポート */
export { oauthProvider as mfMcpOAuthProvider };

/**
 * MCP クライアントを取得する（シングルトン）
 * 未接続の場合は新しいセッションを開始する
 */
export async function getMcpClient(): Promise<Client> {
  if (mcpClient) return mcpClient;

  const client = new Client(
    { name: 'courage-invoice', version: '1.0.0' },
    { capabilities: {} },
  );

  const transport = new StreamableHTTPClientTransport(
    new URL(MF_MCP_SERVER_URL),
    { authProvider: oauthProvider },
  );

  await client.connect(transport);
  mcpClient = client;
  mcpTransport = transport;

  console.log('[MF MCP] サーバーに接続しました');
  const serverInfo = client.getServerVersion();
  if (serverInfo) {
    console.log(`[MF MCP] サーバー: ${serverInfo.name} v${serverInfo.version}`);
  }

  return client;
}

/**
 * MCP 接続を閉じる
 */
export async function closeMcpClient(): Promise<void> {
  if (mcpTransport) {
    await mcpTransport.close();
    mcpTransport = undefined;
  }
  mcpClient = undefined;
  console.log('[MF MCP] 接続を閉じました');
}

/**
 * 認可コードでOAuthフローを完了する
 */
export async function finishMcpAuth(authorizationCode: string): Promise<void> {
  if (!mcpTransport) {
    // 新しい transport を作成して finishAuth する
    const transport = new StreamableHTTPClientTransport(
      new URL(MF_MCP_SERVER_URL),
      { authProvider: oauthProvider },
    );
    await transport.finishAuth(authorizationCode);
    mcpTransport = transport;
  } else {
    await mcpTransport.finishAuth(authorizationCode);
  }
  clearPendingAuthorizationUrl();
  console.log('[MF MCP] 認可が完了しました');
}

// ── 公開ヘルパー関数 ─────────────────────────────────────────────────────────

/**
 * 利用可能なツール一覧を取得する
 */
export async function listMcpTools(): Promise<MFMcpToolInfo[]> {
  const client = await getMcpClient();
  const result = await client.listTools();
  return result.tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema as Record<string, unknown>,
  }));
}

/**
 * MCP ツールを呼び出す
 */
export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<MFMcpResult> {
  const client = await getMcpClient();

  try {
    const result = await client.callTool({ name: toolName, arguments: args });

    // content 配列から text を抽出
    const textParts: string[] = [];
    if ('content' in result && Array.isArray(result.content)) {
      for (const item of result.content) {
        if ('text' in item && typeof item.text === 'string') {
          textParts.push(item.text);
        }
      }
    }

    const rawText = textParts.join('\n');

    // JSON パースを試行
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    return {
      success: !result.isError,
      data,
      error: result.isError ? rawText : undefined,
    };
  } catch (e) {
    return {
      success: false,
      data: null,
      error: String(e),
    };
  }
}

// ── 会計操作の高レベル API ───────────────────────────────────────────────────

/**
 * 事業者情報を取得する
 */
export async function getOfficeInfo(): Promise<MFMcpResult> {
  return callMcpTool('get_office');
}

/**
 * 仕訳一覧を取得する
 */
export async function getJournals(params?: {
  start_date?: string;
  end_date?: string;
  page?: number;
}): Promise<MFMcpResult> {
  return callMcpTool('list_journals', params ?? {});
}

/**
 * 仕訳を作成する
 */
export async function createJournal(journal: Record<string, unknown>): Promise<MFMcpResult> {
  return callMcpTool('create_journal', journal);
}

/**
 * 勘定科目一覧を取得する
 */
export async function getAccountItems(): Promise<MFMcpResult> {
  return callMcpTool('list_account_items', {});
}

/**
 * 取引先一覧を取得する
 */
export async function getPartners(): Promise<MFMcpResult> {
  return callMcpTool('list_partners', {});
}

/**
 * 残高試算表を取得する
 */
export async function getTrialBalance(params?: {
  fiscal_year?: number;
  start_month?: number;
  end_month?: number;
}): Promise<MFMcpResult> {
  return callMcpTool('get_trial_balance', params ?? {});
}

/**
 * 税区分一覧を取得する
 */
export async function getTaxCodes(): Promise<MFMcpResult> {
  return callMcpTool('list_tax_codes', {});
}
