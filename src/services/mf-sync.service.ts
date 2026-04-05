/**
 * MF仕訳自動取り込みパイプライン
 *
 * 1. MF MCPから仕訳一覧を取得
 * 2. 既存MF仕訳IDで重複チェック
 * 3. 新規仕訳をAI分類
 * 4. 確信度に基づいて自動確定/未確定に振り分け
 * 5. Firestoreに保存＋取り込みログ記録
 */

import { randomUUID } from 'crypto';
import { getJournals } from '@/lib/mf-mcp-client';
import { classifyJournalEntries } from './ai-classifier.service';
import type { JournalEntryForClassification, ClassificationResult } from './ai-classifier.service';
import type { Expense, ExpenseImportLog } from '@/types';
import * as expenseRepo from '@/repositories/expense.repository';
import * as importLogRepo from '@/repositories/import-log.repository';
import * as settingsRepo from '@/repositories/system-settings.repository';
import { getFirestoreClient } from '@/repositories/_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

// ── MF仕訳の型（MCPレスポンス） ─────────────────────────────────────────────

interface MFJournalEntry {
  id: string;
  journal_date?: string;
  description?: string;
  amount?: number;
  entries?: Array<{
    account_item_name?: string;
    sub_account_item_name?: string;
    partner_name?: string;
    department_name?: string;
    tax_name?: string;
    debit_amount?: number;
    credit_amount?: number;
    side?: string;
  }>;
  [key: string]: unknown;
}

// ── 重複チェック ─────────────────────────────────────────────────────────────

async function getExistingMfJournalIds(mfIds: string[]): Promise<Set<string>> {
  if (mfIds.length === 0) return new Set();

  const existing = new Set<string>();
  // Firestoreの in クエリは30件まで
  const chunks = [];
  for (let i = 0; i < mfIds.length; i += 30) {
    chunks.push(mfIds.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const snap = await getFirestoreClient()
      .collection(COLLECTIONS.EXPENSES)
      .where('mfJournalId', 'in', chunk)
      .select('mfJournalId')
      .get();
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.mfJournalId) existing.add(data.mfJournalId as string);
    }
  }

  return existing;
}

// ── MF仕訳 → 分類用入力への変換 ─────────────────────────────────────────────

function toClassificationInput(journal: MFJournalEntry): JournalEntryForClassification {
  const debitEntry = journal.entries?.find((e) => e.side === 'debit') ?? journal.entries?.[0];

  return {
    id: journal.id,
    vendor: debitEntry?.partner_name ?? '',
    description: journal.description ?? '',
    amount: debitEntry?.debit_amount ?? journal.amount ?? 0,
    accountItem: debitEntry?.account_item_name,
    subAccount: debitEntry?.sub_account_item_name,
    department: debitEntry?.department_name,
    taxCode: debitEntry?.tax_name,
  };
}

// ── MF仕訳 + 分類結果 → Expense への変換 ────────────────────────────────────

function toExpense(
  journal: MFJournalEntry,
  classification: ClassificationResult,
  threshold: number,
): Expense {
  const input = toClassificationInput(journal);
  const now = new Date().toISOString();
  const isAutoConfirmed = classification.confidence >= threshold;

  return {
    expenseId: randomUUID(),
    date: journal.journal_date ?? new Date().toISOString().slice(0, 10),
    vendor: input.vendor,
    description: input.description,
    amount: input.amount,
    category: classification.category,
    paymentMethod: 'other',
    isAutoClassified: true,
    source: 'mf_sync',
    status: isAutoConfirmed ? 'confirmed' : 'pending',
    confirmedAt: isAutoConfirmed ? now : undefined,
    confirmedBy: isAutoConfirmed ? 'ai_auto' : undefined,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    mfJournalId: journal.id,
    mfAccountItem: input.accountItem,
    mfSubAccount: input.subAccount,
    mfDepartment: input.department,
    mfTaxCode: input.taxCode,
    mfRawData: journal as unknown as Record<string, unknown>,
    aiConfidence: classification.confidence,
    aiSuggestedCategory: classification.category,
    aiSuggestedAccountItem: classification.accountItem,
  };
}

// ── パイプライン本体 ─────────────────────────────────────────────────────────

export interface SyncResult {
  totalFetched: number;
  newImported: number;
  skippedDuplicate: number;
  autoConfirmed: number;
  pendingReview: number;
  errors: number;
  errorDetails: string[];
}

/**
 * MF仕訳の取り込みパイプラインを実行する
 */
export async function runMfSync(): Promise<SyncResult> {
  const settings = await settingsRepo.getSystemSettings();
  const threshold = settings.aiConfidenceThreshold;

  // 最終取り込み日時を取得して期間を決定
  const lastLog = await importLogRepo.getLatestImportLog();
  const startDate = lastLog
    ? lastLog.importedAt.slice(0, 10)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 初回は30日前から
  const endDate = new Date().toISOString().slice(0, 10);

  // 1. MFから仕訳取得
  const mfResult = await getJournals({ start_date: startDate, end_date: endDate });
  if (!mfResult.success) {
    throw new Error(`MF仕訳取得失敗: ${mfResult.error ?? '不明なエラー'}`);
  }

  const journals = extractJournals(mfResult.data);
  const result: SyncResult = {
    totalFetched: journals.length,
    newImported: 0,
    skippedDuplicate: 0,
    autoConfirmed: 0,
    pendingReview: 0,
    errors: 0,
    errorDetails: [],
  };

  if (journals.length === 0) {
    await saveImportLog(result);
    await settingsRepo.updateSystemSettings({ mfLastSyncAt: new Date().toISOString() });
    return result;
  }

  // 2. 重複チェック
  const existingIds = await getExistingMfJournalIds(journals.map((j) => j.id));
  const newJournals = journals.filter((j) => !existingIds.has(j.id));
  result.skippedDuplicate = journals.length - newJournals.length;

  if (newJournals.length === 0) {
    await saveImportLog(result);
    await settingsRepo.updateSystemSettings({ mfLastSyncAt: new Date().toISOString() });
    return result;
  }

  // 3. AI分類
  const classificationInputs = newJournals.map(toClassificationInput);
  let classifications: ClassificationResult[];
  try {
    classifications = await classifyJournalEntries(classificationInputs);
  } catch (err) {
    result.errors = newJournals.length;
    result.errorDetails.push(`AI分類失敗: ${err instanceof Error ? err.message : String(err)}`);
    await saveImportLog(result);
    return result;
  }

  // 分類結果をIDでマッピング
  const classMap = new Map(classifications.map((c) => [c.id, c]));

  // 4. Firestore保存
  for (const journal of newJournals) {
    try {
      const classification = classMap.get(journal.id);
      if (!classification) {
        // AI分類結果がない場合はデフォルトで pending
        const fallback: ClassificationResult = {
          id: journal.id,
          category: 'other',
          accountItem: '',
          confidence: 0,
          reasoning: 'AI分類結果なし',
        };
        const expense = toExpense(journal, fallback, threshold);
        await expenseRepo.createExpense(expense);
        result.pendingReview++;
      } else {
        const expense = toExpense(journal, classification, threshold);
        await expenseRepo.createExpense(expense);
        if (expense.status === 'confirmed') {
          result.autoConfirmed++;
        } else {
          result.pendingReview++;
        }
      }
      result.newImported++;
    } catch (err) {
      result.errors++;
      result.errorDetails.push(
        `仕訳${journal.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 5. ログ記録 + 最終同期日時更新
  await saveImportLog(result);
  await settingsRepo.updateSystemSettings({ mfLastSyncAt: new Date().toISOString() });

  return result;
}

// ── ヘルパー ─────────────────────────────────────────────────────────────────

function extractJournals(data: unknown): MFJournalEntry[] {
  if (Array.isArray(data)) return data as MFJournalEntry[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // MF MCPは { journals: [...] } 形式で返すことがある
    if (Array.isArray(obj.journals)) return obj.journals as MFJournalEntry[];
    if (Array.isArray(obj.data)) return obj.data as MFJournalEntry[];
  }
  return [];
}

async function saveImportLog(result: SyncResult): Promise<void> {
  const log: ExpenseImportLog = {
    logId: randomUUID(),
    importedAt: new Date().toISOString(),
    source: 'mf_sync',
    totalFetched: result.totalFetched,
    newImported: result.newImported,
    skippedDuplicate: result.skippedDuplicate,
    autoConfirmed: result.autoConfirmed,
    pendingReview: result.pendingReview,
    errors: result.errors,
    errorDetails: result.errorDetails.length > 0 ? result.errorDetails : undefined,
  };
  await importLogRepo.createImportLog(log);
}
