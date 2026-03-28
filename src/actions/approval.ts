'use server';

import * as approvalService from '@/services/approval.service';
import type { ApiResponse, DocumentHeader } from '@/types';

// ---------------------------------------------------------------------------
// タスク 1E-02: 承認関連 Server Actions
// ---------------------------------------------------------------------------

/**
 * 承認依頼
 */
export async function requestApproval(
  documentId: string,
  requestedBy: string,
  requestedByName: string,
): Promise<ApiResponse<DocumentHeader>> {
  try {
    const result = await approvalService.requestApproval({
      documentId,
      requestedBy,
      requestedByName,
    });
    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}

/**
 * 承認
 */
export async function approveDocument(
  documentId: string,
  approverId: string,
  approverName: string,
  comment?: string,
): Promise<ApiResponse<DocumentHeader>> {
  try {
    const result = await approvalService.approveDocument({
      documentId,
      approverId,
      approverName,
      comment,
    });
    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}

/**
 * 否認
 */
export async function rejectDocument(
  documentId: string,
  approverId: string,
  approverName: string,
  comment: string,
): Promise<ApiResponse<DocumentHeader>> {
  try {
    const result = await approvalService.rejectDocument({
      documentId,
      approverId,
      approverName,
      comment,
    });
    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}
