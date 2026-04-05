/**
 * マネーフォワード クラウド会計Plus OAuth 2.0 クライアント
 *
 * 認証フロー:
 *   1. /api/auth/mf/start  → MF認可画面へリダイレクト（初回のみ管理者が実行）
 *   2. /api/auth/mf/callback → 認可コードを受け取りトークン取得・Secret Manager保存
 *   3. 以降はrefresh_tokenで自動更新（有効期限540日）
 *
 * API リファレンス:
 *   https://developers.biz.moneyforward.com/docs/partner-api/enterprise-accounting/v3
 */

// MF Biz API 認証エンドポイント（/authorize / /token がパス）
const MF_AUTH_BASE = 'https://api.biz.moneyforward.com';
// クラウド会計Plus API v3
const MF_ACCOUNTING_BASE = 'https://api-enterprise-accounting.moneyforward.com/api/v3';

const REDIRECT_URI =
  process.env.NODE_ENV === 'production'
    ? 'https://courage-invoice-649548596161.asia-northeast1.run.app/api/auth/mf/callback'
    : 'http://localhost:3000/api/auth/mf/callback';

// ── 型定義 ────────────────────────────────────────────────────────────────────

export interface MFTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface MFJournal {
  id: string;
  company_id: number;
  issue_date: string;         // YYYY-MM-DD
  description: string;
  memo?: string;
  details: MFJournalDetail[];
}

export interface MFJournalDetail {
  id: string;
  entry_side: 'debit' | 'credit';  // 借方 | 貸方
  account_item_id: number;
  account_item_name: string;
  tax_code: number;
  amount: number;
  vat: number;
}

// ── OAuth認証情報 ──────────────────────────────────────────────────────────────

function getClientCredentials() {
  const clientId = process.env.MF_OAUTH_CLIENT_ID ?? '';
  const clientSecret = process.env.MF_OAUTH_CLIENT_SECRET ?? '';
  if (!clientId || !clientSecret) {
    throw new Error('MF_OAUTH_CLIENT_ID / MF_OAUTH_CLIENT_SECRET が設定されていません');
  }
  return { clientId, clientSecret };
}

// ── 認可URL生成 ───────────────────────────────────────────────────────────────

export function buildAuthorizationUrl(state: string): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    // 会計Plus APIのスコープ（読み取り権限 + 事業者情報）
    scope: 'mfc/enterprise-accounting/journal.read mfc/enterprise-accounting/master.read mfc/enterprise-accounting/office.read mfc/enterprise-accounting/report.read',
    state,
  });
  return `${MF_AUTH_BASE}/authorize?${params.toString()}`;
}

// ── トークン取得（認可コード → アクセストークン）────────────────────────────────

export async function exchangeCodeForTokens(code: string): Promise<MFTokens> {
  const { clientId, clientSecret } = getClientCredentials();

  // CLIENT_SECRET_BASIC: Authorization ヘッダーに base64(client_id:client_secret)
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch(`${MF_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MF トークン取得エラー (HTTP ${res.status}): ${err}`);
  }

  return res.json() as Promise<MFTokens>;
}

// ── トークン更新 ──────────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<MFTokens> {
  const { clientId, clientSecret } = getClientCredentials();

  // CLIENT_SECRET_BASIC: Authorization ヘッダーに base64(client_id:client_secret)
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch(`${MF_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MF トークン更新エラー (HTTP ${res.status}): ${err}`);
  }

  return res.json() as Promise<MFTokens>;
}

// ── アクセストークンキャッシュ ────────────────────────────────────────────────

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/** Secret Manager の mf-oauth-refresh-token を新しいトークンで上書きする */
async function rotateRefreshToken(newRefreshToken: string): Promise<void> {
  const projectId = process.env.GCP_PROJECT_ID ?? 'courage-invoice-prod';
  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const parent = `projects/${projectId}/secrets/mf-oauth-refresh-token`;
    await client.addSecretVersion({
      parent,
      payload: { data: Buffer.from(newRefreshToken) },
    });
    console.log('[MF OAuth] refresh_token をSecret Managerに自動更新しました');
  } catch (e) {
    // ローテーション失敗はログのみ（アクセストークン自体は使用可能）
    console.error('[MF OAuth] refresh_token の自動更新に失敗しました:', e);
  }
}

export async function getAccessToken(): Promise<string> {
  // キャッシュが有効なら使用（期限5分前に更新）
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  const refreshToken = process.env.MF_OAUTH_REFRESH_TOKEN ?? '';
  if (!refreshToken) {
    throw new Error(
      'MF_OAUTH_REFRESH_TOKEN が設定されていません。' +
      '/api/auth/mf/start から認可フローを実行してください。',
    );
  }

  const tokens = await refreshAccessToken(refreshToken);
  cachedAccessToken = tokens.access_token;
  tokenExpiresAt = Date.now() + tokens.expires_in * 1000;

  // トークンローテーション: MF は refresh_token を使うたびに新しいものを発行する
  if (tokens.refresh_token && tokens.refresh_token !== refreshToken) {
    void rotateRefreshToken(tokens.refresh_token);
  }

  return cachedAccessToken;
}

// ── 会計API共通リクエスト ─────────────────────────────────────────────────────

async function accountingFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${MF_ACCOUNTING_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MF会計API エラー ${path} (HTTP ${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── 会計API公開インターフェース ───────────────────────────────────────────────

class MFAccountingClient {
  /** 仕訳一覧取得（期間指定） */
  async getJournals(fromDate: string, toDate: string, page = 1): Promise<MFJournal[]> {
    const data = await accountingFetch<{ journals: MFJournal[] }>('/journals', {
      start_date: fromDate,
      end_date: toDate,
      page: String(page),
    });
    return data.journals ?? [];
  }
}

export const mfAccountingClient = new MFAccountingClient();
