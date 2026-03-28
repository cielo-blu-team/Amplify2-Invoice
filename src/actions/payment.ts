'use server';

import * as documentRepo from '@/repositories/document.repository';
import type { ApiResponse, DocumentHeader } from '@/types';

export async function updatePaymentStatus(
  documentId: string,
  status: 'paid' | 'overdue'
): Promise<ApiResponse<DocumentHeader>> {
  try {
    await documentRepo.updateDocumentStatus(documentId, status);
    const updated = await documentRepo.getDocumentById(documentId);
    if (!updated) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Document not found: ${documentId}`,
        },
      };
    }
    return { success: true, data: updated };
  } catch (err) {
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    };
  }
}
