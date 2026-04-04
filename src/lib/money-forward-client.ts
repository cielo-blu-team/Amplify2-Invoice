/**
 * マネーフォワード クラウド経費 API クライアント
 *
 * 認証フロー:
 *   APIキー → POST /auth/exchange → JWT (1時間有効)
 *   → 各APIエンドポイントで Bearer JWT を使用
 */

const AUTH_EXCHANGE_URL = 'https://api.biz.moneyforward.com/auth/exchange';
const BASE_URL = 'https://expense.moneyforward.com/api/external/v1';

// ── 型定義 ────────────────────────────────────────────────────────────────────

export interface MFOffice {
  id: string;
  identification_code: string;
  office_type_id: 1 | 2; // 1: 個人, 2: 法人
  name: string;
}

export interface MFExJournalBranchSide {
  debit_or_credit: 'debit' | 'credit';
  account_name: string;
  account_code?: string;
  amount: number;
  tax_code?: string;
  tax_name?: string;
  department_name?: string;
}

export interface MFExJournalBranch {
  branch_number: number;
  remark: string | null;
  ex_journal_branch_sides: MFExJournalBranchSide[];
}

export interface MFExJournal {
  id: string;
  office_id: string;
  recognized_at: string | null; // 取引日 YYYY-MM-DD
  memo: string | null;
  ex_journal_branches: MFExJournalBranch[];
}

export interface MFExJournalWithTransactionId extends MFExJournal {
  ex_transaction_id: string;
}

// ── JWTキャッシュ ─────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getJwt(): Promise<string> {
  const apiKey = process.env.MONEYFORWARD_API_KEY ?? '';
  if (!apiKey) {
    throw new Error('MONEYFORWARD_API_KEY が設定されていません');
  }

  // キャッシュが有効な場合はそのまま返す（期限5分前に更新）
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const res = await fetch(AUTH_EXCHANGE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MF JWT取得エラー (HTTP ${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

// ── APIリクエスト共通処理 ─────────────────────────────────────────────────────

async function mfFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const jwt = await getJwt();
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MF API エラー ${path} (HTTP ${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── 公開API ───────────────────────────────────────────────────────────────────

class MoneyForwardClient {
  /** 所属事業者一覧 */
  async getOffices(): Promise<MFOffice[]> {
    const data = await mfFetch<{ offices: MFOffice[] }>('/offices');
    return data.offices;
  }

  /** 経費明細に紐づく仕訳リスト (計上日範囲指定、最大3ヶ月) */
  async getJournalsByTransactions(
    officeId: string,
    fromDate: string,
    toDate: string,
  ): Promise<MFExJournalWithTransactionId[]> {
    const data = await mfFetch<{ ex_journals: MFExJournalWithTransactionId[] }>(
      `/offices/${officeId}/ex_journals_by_ex_transactions`,
      {
        'query_object[recognized_at_from]': fromDate,
        'query_object[recognized_at_to]': toDate,
      },
    );
    return data.ex_journals ?? [];
  }

  /** 申請に紐づく仕訳リスト (計上日範囲指定、最大3ヶ月) */
  async getJournalsByReports(
    officeId: string,
    fromDate: string,
    toDate: string,
  ): Promise<MFExJournal[]> {
    const data = await mfFetch<{ ex_journals: MFExJournal[] }>(
      `/offices/${officeId}/ex_journals_by_ex_reports`,
      {
        'query_object[recognized_at_from]': fromDate,
        'query_object[recognized_at_to]': toDate,
      },
    );
    return data.ex_journals ?? [];
  }

  /** 特定の経費明細の仕訳 */
  async getJournalByTransaction(
    officeId: string,
    transactionId: string,
  ): Promise<MFExJournal> {
    return mfFetch<MFExJournal>(
      `/offices/${officeId}/ex_transactions/${transactionId}/ex_journal`,
    );
  }
}

export const moneyForwardClient = new MoneyForwardClient();
