# 要件定義：仕訳自動取り込み・PL可視化・催促通知

> 作成日: 2026-04-05 | Version 1.0

---

## 概要

マネーフォワード クラウド会計の仕訳データをMCP経由で自動取り込みし、
AIによる分類・確定を行い、Courage Invoice上で収支管理・未回収催促を実現する。

---

## 1. 仕訳データ自動取り込み

### 1.1 取り込み仕様

| 項目 | 内容 |
|---|---|
| 対象 | MFの仕訳全体（勘定科目の制限なし） |
| 頻度 | 毎日1回（定期自動） |
| 重複排除 | MF仕訳IDで一意管理。取り込み済みはスキップ |
| 月間想定件数 | 約100件 |
| データ取得 | `mfc_ca_getJournals` (MF MCP) |

### 1.2 取り込みフロー

```
[MF MCP] getJournals(前回取込日〜本日)
    ↓
[重複チェック] MF仕訳ID が Firestore に存在するか
    ↓ (新規のみ)
[AI分類] Claude API でバッチ分類
    ↓
[確信度判定]
    ├─ 90%以上 → status: confirmed（自動確定）
    └─ 90%未満 → status: pending（未仕訳一覧へ）
    ↓
[Firestore保存] expenses コレクションに登録
```

---

## 2. AI分類

### 2.1 分類仕様

| 項目 | 内容 |
|---|---|
| 分類エンジン | Claude API（Haiku推奨） |
| 入力 | MF仕訳の摘要・金額・勘定科目・補助科目・取引先・部門・税区分 |
| 出力 | 経費カテゴリ + 勘定科目 + 確信度(0-100%) |
| 処理方式 | バッチ（1回のAPI呼び出しで複数件を分類） |
| 自動確定閾値 | 確信度90%以上 |

### 2.2 分類カテゴリ

既存の `ExpenseCategory` に準拠:
- transportation（交通費）、communication（通信費）、entertainment（接待交際費）
- consumables（消耗品費）、outsourcing（外注費）、advertising（広告宣伝費）
- rent（地代家賃）、insurance（保険料）、tax（租税公課）
- utilities（光熱費）、equipment（機器・備品）、other（その他）

### 2.3 学習機能

ユーザーが手動で修正した分類結果を蓄積し、次回以降のAI分類プロンプトに含める。

- **修正履歴の保存**: 手動修正時に「元のAI分類 → ユーザー確定分類」を記録
- **プロンプトへの反映**: 直近の修正履歴（例: 最新100件）をfew-shot examplesとしてプロンプトに含める
- **保存先**: Firestore `expense_classification_history` コレクション

```
{
  historyId: string,
  mfJournalId: string,
  vendor: string,
  description: string,
  amount: number,
  aiCategory: ExpenseCategory,       // AIの元判定
  aiConfidence: number,              // AIの元確信度
  finalCategory: ExpenseCategory,    // ユーザー確定
  finalAccountItem: string,          // ユーザー確定の勘定科目
  correctedBy: string,               // 修正者
  correctedAt: string,               // 修正日時
}
```

---

## 3. 未仕訳一覧画面（/expenses）

### 3.1 画面構成

| セクション | 内容 |
|---|---|
| タブ① 未確定 | `status: pending` の経費一覧 |
| タブ② 確定済み | `status: confirmed` の経費一覧 |
| タブ③ 全件 | 全経費（フィルタ付き） |

### 3.2 未確定一覧の表示項目

| カラム | 内容 |
|---|---|
| 日付 | 仕訳日 |
| 取引先 | MFの取引先名 |
| 摘要 | MFの摘要 |
| 金額 | 金額 |
| AI分類 | カテゴリ + 確信度バッジ（例: 「交通費 95%」） |
| AI勘定科目 | AIが推定した勘定科目 |
| 操作 | 承認 / 修正して確定 |

### 3.3 操作

- **承認**: AIの分類をそのまま確定
- **修正して確定**: カテゴリ・勘定科目をドロップダウンで変更 → 確定（修正履歴に記録）
- **一括承認**: チェックボックスで複数選択 → まとめて承認

---

## 4. 収支（PL）グラフ（/analytics）

### 4.1 データソース

| 項目 | ソース |
|---|---|
| 売上（Revenue） | Courage Invoiceの発行済み請求書（`documentType: invoice`） |
| 費用（Expenses） | 確定済み経費（`status: confirmed`） |
| 利益（Profit） | 売上 − 費用 |

### 4.2 表示機能

| 機能 | 内容 |
|---|---|
| 月次グラフ | 棒グラフ（売上/費用）+ 折れ線（利益） |
| 四半期グラフ | Q1〜Q4 の集計 |
| 年次グラフ | 年間サマリ |
| 前年同月比 | 前年データとの比較表示 |
| 期間選択 | カスタム期間指定 |

### 4.3 サマリ表示

- 総売上 / 総費用 / 純利益
- 利益率（%）
- カテゴリ別経費内訳（円グラフ）

---

## 5. 支払催促通知

### 5.1 通知条件

| タイミング | 条件 | 通知種別 |
|---|---|---|
| 支払期日1日前 | `dueDate - 1日 == 本日` かつ `status != paid` | リマインド |
| 期限超過（即時） | `dueDate < 本日` かつ `status != paid` | 催促 |
| 3日超過 | `dueDate + 3日 == 本日` かつ `status != paid` | 催促（段階1） |
| 7日超過 | `dueDate + 7日 == 本日` かつ `status != paid` | 催促（段階2） |
| 14日超過 | `dueDate + 14日 == 本日` かつ `status != paid` | 催促（段階3） |

### 5.2 通知先

- UIの設定画面（`/settings`）で指定したSlackチャンネル
- Slack Bot（Courage Invoice）経由で投稿

### 5.3 通知メッセージ例

**リマインド（1日前）:**
```
📋 明日が支払期日の請求書があります
━━━━━━━━━━━━━━━━━━
請求書番号: INV-2026-0042
取引先: 株式会社ABC
金額: ¥550,000
支払期日: 2026-04-06（明日）
```

**催促（超過時）:**
```
⚠️ 支払期限を超過した請求書があります
━━━━━━━━━━━━━━━━━━
請求書番号: INV-2026-0038
取引先: 株式会社XYZ
金額: ¥330,000
支払期日: 2026-03-31（5日超過）
```

### 5.4 チェック頻度

- 毎日1回（仕訳取り込みと同タイミング）

---

## 6. 設定画面への追加（/settings）

| 設定項目 | 内容 |
|---|---|
| Slack催促通知チャンネル | チャンネル名 or チャンネルIDを指定 |
| MF連携状態 | 接続OK/NG、最終取り込み日時 |
| 自動取り込み有効/無効 | トグルスイッチ |
| AI分類の確信度閾値 | デフォルト90%、変更可能 |

---

## 7. データモデル追加・変更

### 7.1 Expense型の拡張

```typescript
interface Expense {
  // 既存フィールド（変更なし）
  expenseId: string;
  date: string;
  vendor: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  // ...

  // 追加フィールド
  mfJournalId?: string;          // MF仕訳ID（重複排除キー）
  mfAccountItem?: string;        // MFの勘定科目名
  mfSubAccount?: string;         // MFの補助科目名
  mfDepartment?: string;         // MFの部門名
  mfTaxCode?: string;            // MFの税区分
  aiConfidence?: number;         // AI確信度（0-100）
  aiSuggestedCategory?: ExpenseCategory;  // AIの分類候補
  aiSuggestedAccountItem?: string;        // AIの勘定科目候補
}
```

### 7.2 新規コレクション

| コレクション | 用途 |
|---|---|
| `expense_classification_history` | AI分類の修正履歴（学習用） |
| `expense_import_logs` | 取り込みログ（最終取込日時、件数、エラー） |
| `system_settings` | Slack通知チャンネル、AI閾値等のシステム設定 |

### 7.3 催促通知ログ

```typescript
interface PaymentReminderLog {
  logId: string;
  documentId: string;         // 請求書ID
  reminderType: 'pre_due' | 'overdue' | 'overdue_3d' | 'overdue_7d' | 'overdue_14d';
  sentAt: string;
  slackChannel: string;
  slackMessageTs?: string;    // Slack投稿のts（重複送信防止）
}
```

---

## 8. 実装スコープ

### Phase 1: 基盤
- Expense型拡張、新規コレクション作成
- AI分類サービス実装
- MF仕訳取り込みパイプライン

### Phase 2: UI
- 未仕訳一覧画面（/expenses）
- 承認・修正フロー
- 設定画面の拡張（/settings）

### Phase 3: 可視化・通知
- PLグラフ画面（/analytics）
- 催促通知ロジック + Slack送信
- 日次バッチジョブ設定

---

## 技術的な決定事項

| 項目 | 決定 |
|---|---|
| AI分類 | Claude API (Haiku) — バッチ処理 |
| 日次バッチ | Cloud Run Jobs（Cloud Scheduler でトリガー） |
| グラフライブラリ | Recharts（Next.js との親和性） |
| Slack通知 | 既存 Slack Bot（Courage Invoice）を利用 |
