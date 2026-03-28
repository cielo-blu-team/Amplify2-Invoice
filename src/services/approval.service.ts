import * as documentRepo from '@/repositories/document.repository';
import type { DocumentHeader, DocumentStatus, ApprovalRecord } from '@/types';
import type { ApprovalAction } from '@/types/approval';

// 承認依頼レコード（action を持たない）
type ApprovalRequestRecord = Omit<ApprovalRecord, 'PK' | 'SK' | 'action'> & {
  action?: ApprovalAction;
  requestedBy: string;
  requestedByName: string;
};

/**
 * 承認依頼
 * - status が 'draft' であることを確認してから 'pending_approval' に更新
 * - 承認依頼レコードを追加（action なし、requestedBy のみ）
 */
export async function requestApproval(params: {
  documentId: string;
  requestedBy: string;
  requestedByName: string;
}): Promise<DocumentHeader> {
  const { documentId, requestedBy, requestedByName } = params;

  const doc = await documentRepo.getDocumentById(documentId);
  if (!doc) {
    throw new Error(`帳票が見つかりません: ${documentId}`);
  }
  if (doc.status !== 'draft') {
    throw new Error(
      `承認依頼できません。ステータスが 'draft' である必要があります（現在: '${doc.status}'）`,
    );
  }

  const timestamp = new Date().toISOString();

  await documentRepo.updateDocumentStatus(documentId, 'pending_approval');

  const requestRecord: Omit<ApprovalRequestRecord, 'PK' | 'SK'> = {
    approvedBy: requestedBy,
    requestedBy,
    requestedByName,
    previousStatus: 'draft',
    newStatus: 'pending_approval',
    timestamp,
  };
  // ApprovalRecord の action フィールドが必須のため型アサーションを使用
  await documentRepo.addApprovalRecord(
    documentId,
    requestRecord as Omit<ApprovalRecord, 'PK' | 'SK'>,
  );

  const updated = await documentRepo.getDocumentById(documentId);
  if (!updated) {
    throw new Error(`帳票の再取得に失敗しました: ${documentId}`);
  }
  return updated;
}

/**
 * 承認
 * - status が 'pending_approval' であることを確認
 * - 四眼原則: 依頼者と承認者が同一ユーザーの場合はエラー
 * - status を 'approved' に更新し、承認履歴を追加
 */
export async function approveDocument(params: {
  documentId: string;
  approverId: string;
  approverName: string;
  comment?: string;
}): Promise<DocumentHeader> {
  const { documentId, approverId, approverName, comment } = params;

  const doc = await documentRepo.getDocumentById(documentId);
  if (!doc) {
    throw new Error(`帳票が見つかりません: ${documentId}`);
  }
  if (doc.status !== 'pending_approval') {
    throw new Error(
      `承認できません。ステータスが 'pending_approval' である必要があります（現在: '${doc.status}'）`,
    );
  }

  // 承認履歴から requestedBy を取得（四眼原則チェック）
  const history = await documentRepo.getApprovalHistory(documentId);
  const requestRecord = history.find(
    (r) =>
      (r as unknown as { requestedBy?: string }).requestedBy !== undefined ||
      r.previousStatus === 'draft',
  );
  const requestedBy: string | undefined =
    requestRecord !== undefined
      ? ((requestRecord as unknown as { requestedBy?: string }).requestedBy ??
        requestRecord.approvedBy)
      : undefined;

  if (requestedBy !== undefined && requestedBy === approverId) {
    throw new Error('依頼者と承認者は異なるユーザーである必要があります');
  }

  const timestamp = new Date().toISOString();

  await documentRepo.updateDocumentStatus(documentId, 'approved');

  const approvalRecord: Omit<ApprovalRecord, 'PK' | 'SK'> = {
    approvedBy: approverId,
    action: 'approve',
    comment,
    previousStatus: 'pending_approval',
    newStatus: 'approved',
    timestamp,
  };
  await documentRepo.addApprovalRecord(documentId, approvalRecord);

  const updated = await documentRepo.getDocumentById(documentId);
  if (!updated) {
    throw new Error(`帳票の再取得に失敗しました: ${documentId}`);
  }
  return updated;
}

/**
 * 否認
 * - status が 'pending_approval' であることを確認
 * - status を 'rejected' に更新し、承認履歴（action: 'reject'）を追加
 * - comment は必須
 */
export async function rejectDocument(params: {
  documentId: string;
  approverId: string;
  approverName: string;
  comment: string;
}): Promise<DocumentHeader> {
  const { documentId, approverId, approverName, comment } = params;

  const doc = await documentRepo.getDocumentById(documentId);
  if (!doc) {
    throw new Error(`帳票が見つかりません: ${documentId}`);
  }
  if (doc.status !== 'pending_approval') {
    throw new Error(
      `否認できません。ステータスが 'pending_approval' である必要があります（現在: '${doc.status}'）`,
    );
  }

  const timestamp = new Date().toISOString();

  await documentRepo.updateDocumentStatus(documentId, 'rejected');

  const rejectRecord: Omit<ApprovalRecord, 'PK' | 'SK'> = {
    approvedBy: approverId,
    action: 'reject',
    comment,
    previousStatus: 'pending_approval',
    newStatus: 'rejected',
    timestamp,
  };
  await documentRepo.addApprovalRecord(documentId, rejectRecord);

  const updated = await documentRepo.getDocumentById(documentId);
  if (!updated) {
    throw new Error(`帳票の再取得に失敗しました: ${documentId}`);
  }
  return updated;
}

/**
 * 承認待ち帳票一覧取得
 */
export async function getPendingApprovals(): Promise<DocumentHeader[]> {
  const result = await documentRepo.listDocuments({ status: ['pending_approval'] });
  return result.items;
}
