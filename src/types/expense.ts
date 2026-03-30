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
  source: 'manual' | 'import';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
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
