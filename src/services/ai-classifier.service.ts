/**
 * AI分類サービス
 *
 * MFから取り込んだ仕訳データをClaude APIでバッチ分類する。
 * 過去の修正履歴をfew-shot examplesとしてプロンプトに含め、学習する。
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ExpenseCategory, ClassificationHistory } from '@/types';
import { getFirestoreClient } from '@/repositories/_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── 型定義 ────────────────────────────────────────────────────────────────────

export interface JournalEntryForClassification {
  id: string;           // MF仕訳ID or 一時ID
  vendor: string;       // 取引先名
  description: string;  // 摘要
  amount: number;
  accountItem?: string; // MFの勘定科目
  subAccount?: string;  // MFの補助科目
  department?: string;  // MFの部門
  taxCode?: string;     // MFの税区分
}

export interface ClassificationResult {
  id: string;
  category: ExpenseCategory;
  accountItem: string;
  confidence: number;   // 0-100
  reasoning: string;    // 分類理由
}

// ── 有効カテゴリ一覧 ─────────────────────────────────────────────────────────

const VALID_CATEGORIES: ExpenseCategory[] = [
  'transportation', 'communication', 'entertainment', 'consumables',
  'outsourcing', 'advertising', 'rent', 'insurance', 'tax',
  'utilities', 'equipment', 'other',
];

const CATEGORY_DESCRIPTIONS: Record<ExpenseCategory, string> = {
  transportation: '交通費（電車・タクシー・飛行機・ガソリン代等）',
  communication: '通信費（電話・インターネット・郵便等）',
  entertainment: '接待交際費（会食・贈答・慶弔等）',
  consumables: '消耗品費（文具・日用品・10万円未満の備品等）',
  outsourcing: '外注費（業務委託・フリーランスへの支払い等）',
  advertising: '広告宣伝費（広告出稿・PR・販促物等）',
  rent: '地代家賃（オフィス賃料・駐車場・レンタルスペース等）',
  insurance: '保険料（損害保険・賠償責任保険等）',
  tax: '租税公課（印紙税・固定資産税・自動車税等）',
  utilities: '光熱費（電気・ガス・水道等）',
  equipment: '機器・備品（PC・モニター・家具等10万円以上）',
  other: 'その他（上記に該当しないもの）',
};

// ── 修正履歴の取得 ───────────────────────────────────────────────────────────

async function getRecentCorrectionHistory(limit: number = 100): Promise<ClassificationHistory[]> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.CLASSIFICATION_HISTORY)
    .orderBy('correctedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ ...d.data(), historyId: d.id }) as ClassificationHistory);
}

// ── プロンプト構築 ───────────────────────────────────────────────────────────

function buildSystemPrompt(corrections: ClassificationHistory[]): string {
  let prompt = `あなたは会計仕訳の分類エキスパートです。
与えられた仕訳データを分析し、最も適切な経費カテゴリと勘定科目を判定してください。

## 利用可能なカテゴリ

${VALID_CATEGORIES.map((c) => `- ${c}: ${CATEGORY_DESCRIPTIONS[c]}`).join('\n')}

## 判定ルール

1. 取引先名、摘要、MFの勘定科目情報を総合的に判断する
2. MFの勘定科目が設定されている場合は有力なヒントとして活用する
3. 確信度は0-100で正直に評価する。判断材料が少ない場合は低めにする
4. reasoningには判断根拠を簡潔に日本語で記す

## 出力形式

JSON配列で返してください。各要素は以下の形式:
{
  "id": "仕訳ID",
  "category": "カテゴリ名",
  "accountItem": "勘定科目名",
  "confidence": 95,
  "reasoning": "判断根拠"
}`;

  if (corrections.length > 0) {
    prompt += '\n\n## 過去の修正履歴（学習データ）\n\n以下はユーザーが過去に修正した分類結果です。同様のパターンがあれば参考にしてください:\n\n';
    for (const c of corrections.slice(0, 50)) {
      prompt += `- 取引先「${c.vendor}」摘要「${c.description}」金額${c.amount}円 → AI判定: ${c.aiCategory} → ユーザー確定: ${c.finalCategory}${c.finalAccountItem ? `（${c.finalAccountItem}）` : ''}\n`;
    }
  }

  return prompt;
}

function buildUserMessage(entries: JournalEntryForClassification[]): string {
  const items = entries.map((e) => ({
    id: e.id,
    vendor: e.vendor,
    description: e.description,
    amount: e.amount,
    mfAccountItem: e.accountItem ?? '未設定',
    mfSubAccount: e.subAccount ?? '',
    mfDepartment: e.department ?? '',
    mfTaxCode: e.taxCode ?? '',
  }));

  return `以下の${entries.length}件の仕訳を分類してください:\n\n${JSON.stringify(items, null, 2)}`;
}

// ── 分類実行 ─────────────────────────────────────────────────────────────────

/**
 * 仕訳エントリをバッチでAI分類する
 *
 * @param entries - 分類対象の仕訳一覧
 * @returns 分類結果の配列
 */
export async function classifyJournalEntries(
  entries: JournalEntryForClassification[],
): Promise<ClassificationResult[]> {
  if (entries.length === 0) return [];

  const corrections = await getRecentCorrectionHistory();
  const systemPrompt = buildSystemPrompt(corrections);
  const userMessage = buildUserMessage(entries);

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  // レスポンスからJSONを抽出
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('AI分類: テキスト応答が見つかりません');
  }

  const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('AI分類: JSON配列が見つかりません');
  }

  const parsed: unknown[] = JSON.parse(jsonMatch[0]);

  return parsed.map((item) => {
    const obj = item as Record<string, unknown>;
    const category = VALID_CATEGORIES.includes(obj.category as ExpenseCategory)
      ? (obj.category as ExpenseCategory)
      : 'other';

    return {
      id: String(obj.id ?? ''),
      category,
      accountItem: String(obj.accountItem ?? ''),
      confidence: Math.min(100, Math.max(0, Number(obj.confidence ?? 0))),
      reasoning: String(obj.reasoning ?? ''),
    };
  });
}

// ── 修正履歴の保存 ───────────────────────────────────────────────────────────

/**
 * ユーザーがAI分類を修正した際の履歴を保存する
 */
export async function saveClassificationCorrection(
  correction: Omit<ClassificationHistory, 'historyId'>,
): Promise<void> {
  const db = getFirestoreClient();
  const docRef = db.collection(COLLECTIONS.CLASSIFICATION_HISTORY).doc();
  await docRef.set({ ...correction, historyId: docRef.id });
}
