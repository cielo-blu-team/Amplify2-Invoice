// API レスポンス共通型

// 成功レスポンス
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

// エラーレスポンス
export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// エラーコード（要件定義書 5.5.2）
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INVALID_STATUS'
  | 'STATUS_CONSTRAINT_ERROR'
  | 'DUPLICATE_REQUEST'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR';

// ページネーション結果
export interface PaginatedResult<T> {
  items: T[];
  cursor?: string; // 次ページのカーソル（なければ最終ページ）
  totalCount?: number;
}

// 自社情報（Settings テーブル SETTING#company）
export interface CompanySettings {
  companyName: string;
  representativeName: string;
  registrationNumber: string; // T+13桁
  postalCode: string;
  address: string;
  phone: string;
  fax?: string;
  email: string;
  bankName: string;
  branchName: string;
  accountType: 'ordinary' | 'current';
  accountNumber: string;
  accountHolder: string;
  logoUrl?: string;
  sealUrl?: string;
}

// 監査ログ
export interface AuditLog {
  PK: string; // LOG#{date}
  SK: string; // {timestamp}#{eventId}
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

// ダッシュボードデータ
export interface DashboardData {
  monthlySales: number;
  unpaidBalance: number;
  overdueCount: number;
  monthlyCreatedCount: { estimates: number; invoices: number };
  estimateWinRate: number; // 0〜1
  paymentAlerts: PaymentAlert[];
}

export interface PaymentAlert {
  documentId: string;
  documentNumber: string;
  clientName: string;
  totalAmount: number;
  dueDate: string;
  daysUntilDue: number;
}
