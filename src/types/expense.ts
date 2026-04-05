// 経費カテゴリ
export type ExpenseCategory =
  | 'transportation'  // 交通費
  | 'communication'   // 通信費
  | 'entertainment'   // 接待交際費
  | 'consumables'     // 消耗品費
  | 'outsourcing'     // 外注費
  | 'advertising'     // 広告宣伝費
  | 'rent'            // 地代家賃
  | 'insurance'       // 保険料
  | 'tax'             // 租税公課
  | 'utilities'       // 光熱費
  | 'equipment'       // 機器・備品
  | 'other';          // その他

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transportation: '交通費',
  communication: '通信費',
  entertainment: '接待交際費',
  consumables: '消耗品費',
  outsourcing: '外注費',
  advertising: '広告宣伝費',
  rent: '地代家賃',
  insurance: '保険料',
  tax: '租税公課',
  utilities: '光熱費',
  equipment: '機器・備品',
  other: 'その他',
};

// 支払方法
export type PaymentMethod = 'cash' | 'credit_card' | 'bank_transfer' | 'other';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '現金',
  credit_card: 'クレジットカード',
  bank_transfer: '銀行振込',
  other: 'その他',
};

// 経費ステータス
export type ExpenseStatus = 'pending' | 'confirmed';

// 経費
export interface Expense {
  expenseId: string;
  date: string;         // YYYY-MM-DD
  vendor: string;       // 支払先
  description: string;  // 摘要
  amount: number;
  category: ExpenseCategory;
  subCategory?: string;
  paymentMethod: PaymentMethod;
  clientId?: string;
  projectId?: string;
  isAutoClassified: boolean;
  source: 'manual' | 'import' | 'mf_sync';
  status: ExpenseStatus; // pending=仮登録 / confirmed=本確定
  confirmedAt?: string;
  confirmedBy?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  // MF連携フィールド
  mfJournalId?: string;          // MF仕訳ID（重複排除キー）
  mfAccountItem?: string;        // MFの勘定科目名
  mfSubAccount?: string;         // MFの補助科目名
  mfDepartment?: string;         // MFの部門名
  mfTaxCode?: string;            // MFの税区分
  mfRawData?: Record<string, unknown>; // MF仕訳の生データ

  // AI分類フィールド
  aiConfidence?: number;                // AI確信度（0-100）
  aiSuggestedCategory?: ExpenseCategory; // AIの分類候補
  aiSuggestedAccountItem?: string;       // AIの勘定科目候補
}

// 経費作成入力
export interface ExpenseCreateInput {
  date: string;
  vendor: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  subCategory?: string;
  paymentMethod: PaymentMethod;
  clientId?: string;
  projectId?: string;
  isAutoClassified?: boolean;
  source?: 'manual' | 'import';
}

// 分類ルール条件
export type RuleField = 'vendor' | 'description';
export type RuleOperator = 'contains' | 'equals' | 'starts_with' | 'ends_with';

export interface RuleCondition {
  field: RuleField;
  operator: RuleOperator;
  value: string;
}

// 分類ルール
export interface ExpenseRule {
  ruleId: string;
  name: string;
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  category: ExpenseCategory;
  subCategory?: string;
  priority: number; // 小さいほど優先
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// 分類ルール作成入力
export interface ExpenseRuleCreateInput {
  name: string;
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  category: ExpenseCategory;
  subCategory?: string;
  priority?: number;
}

// AI分類修正履歴（学習用）
export interface ClassificationHistory {
  historyId: string;
  mfJournalId?: string;
  vendor: string;
  description: string;
  amount: number;
  aiCategory: ExpenseCategory;
  aiConfidence: number;
  aiAccountItem?: string;
  finalCategory: ExpenseCategory;
  finalAccountItem?: string;
  correctedBy: string;
  correctedAt: string;
}

// 取り込みログ
export interface ExpenseImportLog {
  logId: string;
  importedAt: string;
  source: 'mf_sync';
  totalFetched: number;
  newImported: number;
  skippedDuplicate: number;
  autoConfirmed: number;   // AI確信度90%以上で自動確定した件数
  pendingReview: number;   // 手動確認待ちの件数
  errors: number;
  errorDetails?: string[];
}

// システム設定
export interface SystemSettings {
  slackReminderChannel?: string;      // 催促通知先Slackチャンネル
  mfSyncEnabled: boolean;             // MF自動取り込み有効/無効
  mfLastSyncAt?: string;              // 最終取り込み日時
  aiConfidenceThreshold: number;      // AI分類の自動確定閾値（デフォルト90）
}

// 催促通知ログ（重複送信防止）
export type ReminderType = 'pre_due' | 'overdue' | 'overdue_3d' | 'overdue_7d' | 'overdue_14d';

export interface PaymentReminderLog {
  logId: string;
  documentId: string;
  documentNumber: string;
  reminderType: ReminderType;
  sentAt: string;
  slackChannel: string;
  slackMessageTs?: string;
}

// 収支データ
export interface ProfitLossMonth {
  month: string;       // YYYY-MM
  revenue: number;     // 売上（入金済み請求）
  expenses: number;    // 経費合計
  profit: number;      // 純利益
}

export interface ProfitLossSummary {
  monthly: ProfitLossMonth[];
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  profitMargin: number; // 0-100
}
