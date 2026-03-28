// 帳票ステータス（要件定義書 4.4.2 / 設計書 3.1.2）
export type DocumentStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'confirmed'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'rejected';

export type DocumentType = 'estimate' | 'invoice';

// 税率（整数値: 10=標準税率, 8=軽減税率, 0=非課税）
export type TaxRate = 10 | 8 | 0;

// 帳票ヘッダー（Documents テーブル SK: META）
export interface DocumentHeader {
  PK: string; // DOC#{documentId}
  SK: 'META';
  documentId: string;
  documentType: DocumentType;
  documentNumber: string; // EST-YYYYMMDD-NNN / INV-YYYYMMDD-NNN
  status: DocumentStatus;
  clientId: string;
  clientName: string; // 非正規化
  subject: string;
  issueDate: string; // ISO 8601
  validUntil?: string; // 見積書のみ
  dueDate?: string; // 請求書のみ
  subtotal: number;
  tax10Amount: number;
  tax8Amount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  pdfUrl?: string; // 原本PDF（Object Lock適用）
  cancelledPdfUrl?: string; // 取消版PDF
  sourceEstimateId?: string; // 変換元見積書ID
  convertedToInvoiceId?: string; // 変換先請求書ID
  originalDocumentId?: string; // 改訂元帳票ID
  revisedByDocumentId?: string; // 改訂先帳票ID
  revisionNumber?: number;
  cancelledReason?: string;
  isDeleted: boolean; // 論理削除フラグ（draftのみ削除可）
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 明細行（Documents テーブル SK: ITEM#{sortOrder}）
export interface LineItem {
  PK: string; // DOC#{documentId}
  SK: string; // ITEM#{sortOrder}
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: TaxRate;
  amount: number; // quantity × unitPrice
  sortOrder: number;
}

// 承認履歴（Documents テーブル SK: APPROVAL#{timestamp}）
export interface ApprovalRecord {
  PK: string; // DOC#{documentId}
  SK: string; // APPROVAL#{timestamp}
  approvedBy: string;
  action: 'approve' | 'reject';
  comment?: string;
  previousStatus: DocumentStatus;
  newStatus: DocumentStatus;
  timestamp: string;
}

// 消費税計算結果
export interface TaxSummary {
  subtotal: number;
  tax10Subtotal: number;
  tax10Amount: number;
  tax8Subtotal: number;
  tax8Amount: number;
  taxExemptSubtotal: number;
  taxAmount: number;
  totalAmount: number;
}

// 帳票作成入力（明細行含む）
export interface DocumentCreateInput {
  documentType: DocumentType;
  clientId: string;
  subject: string;
  issueDate: string;
  validUntil?: string;
  dueDate?: string;
  notes?: string;
  items: LineItemInput[];
}

// 明細行入力
export interface LineItemInput {
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: TaxRate;
}

// 帳票一覧フィルタ
export interface DocumentListFilters {
  documentType?: DocumentType;
  status?: DocumentStatus[];
  clientName?: string;
  documentNumber?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
  amountMin?: number;
  amountMax?: number;
  createdBy?: string;
  limit?: number;
  cursor?: string; // LastEvaluatedKey
}

// ステータス遷移ルール
export const ESTIMATE_STATUSES: DocumentStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'confirmed',
  'sent',
  'cancelled',
  'rejected',
];

export const INVOICE_STATUSES: DocumentStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'confirmed',
  'sent',
  'paid',
  'overdue',
  'cancelled',
  'rejected',
];
