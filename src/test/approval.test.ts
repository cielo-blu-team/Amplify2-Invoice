import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DocumentHeader, ApprovalRecord } from '@/types';

// DynamoDB 呼び出しをモック（リポジトリ層をまるごとモック）
vi.mock('@/repositories/document.repository');

import * as documentRepo from '@/repositories/document.repository';
import {
  approveDocument,
  rejectDocument,
  requestApproval,
} from '@/services/approval.service';

// テスト用ヘルパー: DocumentHeader のベースオブジェクト
function makeDocumentHeader(overrides: Partial<DocumentHeader> = {}): DocumentHeader {
  return {
    PK: 'DOC#test-doc-001',
    SK: 'META',
    documentId: 'test-doc-001',
    documentType: 'estimate',
    documentNumber: 'EST-20240115-001',
    status: 'pending_approval',
    clientId: 'client-001',
    clientName: 'テスト取引先',
    subject: 'テスト見積書',
    issueDate: '2024-01-15',
    subtotal: 10000,
    tax10Amount: 1000,
    tax8Amount: 0,
    taxAmount: 1000,
    totalAmount: 11000,
    isDeleted: false,
    createdBy: 'user-requester',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    ...overrides,
  };
}

// テスト用ヘルパー: 承認依頼の ApprovalRecord（requestedBy フィールド付き）
function makeApprovalRequestRecord(requestedBy: string): ApprovalRecord & { requestedBy: string } {
  return {
    PK: 'DOC#test-doc-001',
    SK: 'APPROVAL#2024-01-15T00:00:00.000Z',
    approvedBy: requestedBy,
    action: 'approve',
    previousStatus: 'draft',
    newStatus: 'pending_approval',
    timestamp: '2024-01-15T00:00:00.000Z',
    requestedBy,
  };
}

describe('approveDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('依頼者と承認者が同一ユーザーの場合はエラー（四眼原則）', async () => {
    const doc = makeDocumentHeader({ status: 'pending_approval' });
    const requestedBy = 'user-requester';

    vi.mocked(documentRepo.getDocumentById).mockResolvedValue(doc);
    vi.mocked(documentRepo.getApprovalHistory).mockResolvedValue([
      makeApprovalRequestRecord(requestedBy),
    ]);

    await expect(
      approveDocument({
        documentId: 'test-doc-001',
        approverId: requestedBy, // 依頼者と同じ
        approverName: '依頼者',
      }),
    ).rejects.toThrow('依頼者と承認者は異なるユーザーである必要があります');
  });

  it('別ユーザーなら正常に承認される', async () => {
    const doc = makeDocumentHeader({ status: 'pending_approval' });
    const approvedDoc = makeDocumentHeader({ status: 'approved' });

    vi.mocked(documentRepo.getDocumentById)
      .mockResolvedValueOnce(doc)       // 最初の取得
      .mockResolvedValueOnce(approvedDoc); // 更新後の再取得
    vi.mocked(documentRepo.getApprovalHistory).mockResolvedValue([
      makeApprovalRequestRecord('user-requester'),
    ]);
    vi.mocked(documentRepo.updateDocumentStatus).mockResolvedValue(undefined);
    vi.mocked(documentRepo.addApprovalRecord).mockResolvedValue(undefined);

    const result = await approveDocument({
      documentId: 'test-doc-001',
      approverId: 'user-approver', // 依頼者とは別のユーザー
      approverName: '承認者',
      comment: '問題なし',
    });

    expect(result.status).toBe('approved');
    expect(documentRepo.updateDocumentStatus).toHaveBeenCalledWith(
      'test-doc-001',
      'approved',
    );
    expect(documentRepo.addApprovalRecord).toHaveBeenCalledOnce();
  });
});

describe('rejectDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pending_approval 以外のステータスはエラー（draft の場合）', async () => {
    const doc = makeDocumentHeader({ status: 'draft' });
    vi.mocked(documentRepo.getDocumentById).mockResolvedValue(doc);

    await expect(
      rejectDocument({
        documentId: 'test-doc-001',
        approverId: 'user-approver',
        approverName: '承認者',
        comment: '否認理由',
      }),
    ).rejects.toThrow("否認できません。ステータスが 'pending_approval' である必要があります");
  });

  it('pending_approval 以外のステータスはエラー（approved の場合）', async () => {
    const doc = makeDocumentHeader({ status: 'approved' });
    vi.mocked(documentRepo.getDocumentById).mockResolvedValue(doc);

    await expect(
      rejectDocument({
        documentId: 'test-doc-001',
        approverId: 'user-approver',
        approverName: '承認者',
        comment: '否認理由',
      }),
    ).rejects.toThrow("否認できません。ステータスが 'pending_approval' である必要があります");
  });

  it('pending_approval のステータスなら正常に否認される', async () => {
    const doc = makeDocumentHeader({ status: 'pending_approval' });
    const rejectedDoc = makeDocumentHeader({ status: 'rejected' });

    vi.mocked(documentRepo.getDocumentById)
      .mockResolvedValueOnce(doc)
      .mockResolvedValueOnce(rejectedDoc);
    vi.mocked(documentRepo.updateDocumentStatus).mockResolvedValue(undefined);
    vi.mocked(documentRepo.addApprovalRecord).mockResolvedValue(undefined);

    const result = await rejectDocument({
      documentId: 'test-doc-001',
      approverId: 'user-approver',
      approverName: '承認者',
      comment: '内容を再確認してください',
    });

    expect(result.status).toBe('rejected');
    expect(documentRepo.updateDocumentStatus).toHaveBeenCalledWith(
      'test-doc-001',
      'rejected',
    );
  });
});

describe('requestApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('draft 以外のステータスはエラー（pending_approval の場合）', async () => {
    const doc = makeDocumentHeader({ status: 'pending_approval' });
    vi.mocked(documentRepo.getDocumentById).mockResolvedValue(doc);

    await expect(
      requestApproval({
        documentId: 'test-doc-001',
        requestedBy: 'user-requester',
        requestedByName: '依頼者',
      }),
    ).rejects.toThrow("承認依頼できません。ステータスが 'draft' である必要があります");
  });

  it('draft 以外のステータスはエラー（approved の場合）', async () => {
    const doc = makeDocumentHeader({ status: 'approved' });
    vi.mocked(documentRepo.getDocumentById).mockResolvedValue(doc);

    await expect(
      requestApproval({
        documentId: 'test-doc-001',
        requestedBy: 'user-requester',
        requestedByName: '依頼者',
      }),
    ).rejects.toThrow("承認依頼できません。ステータスが 'draft' である必要があります");
  });

  it('draft ステータスなら正常に承認依頼される', async () => {
    const doc = makeDocumentHeader({ status: 'draft' });
    const pendingDoc = makeDocumentHeader({ status: 'pending_approval' });

    vi.mocked(documentRepo.getDocumentById)
      .mockResolvedValueOnce(doc)
      .mockResolvedValueOnce(pendingDoc);
    vi.mocked(documentRepo.updateDocumentStatus).mockResolvedValue(undefined);
    vi.mocked(documentRepo.addApprovalRecord).mockResolvedValue(undefined);

    const result = await requestApproval({
      documentId: 'test-doc-001',
      requestedBy: 'user-requester',
      requestedByName: '依頼者',
    });

    expect(result.status).toBe('pending_approval');
    expect(documentRepo.updateDocumentStatus).toHaveBeenCalledWith(
      'test-doc-001',
      'pending_approval',
    );
    expect(documentRepo.addApprovalRecord).toHaveBeenCalledOnce();
  });
});
