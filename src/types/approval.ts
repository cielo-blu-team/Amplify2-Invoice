import type { DocumentStatus } from './document';

// 承認アクション
export type ApprovalAction = 'approve' | 'reject';

// 承認履歴
export interface ApprovalHistory {
  documentId: string;
  approvedBy: string;
  approverName: string;
  action: ApprovalAction;
  comment?: string;
  previousStatus: DocumentStatus;
  newStatus: DocumentStatus;
  timestamp: string;
}

// 承認依頼入力
export interface ApprovalRequestInput {
  documentId: string;
}

// 承認操作入力
export interface ApprovalOperationInput {
  documentId: string;
  action: ApprovalAction;
  comment?: string; // reject時は必須
}
