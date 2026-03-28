'use server';

import * as documentService from '@/services/document.service';
import {
  documentCreateSchema,
  documentUpdateSchema,
  documentCancelSchema,
} from '@/schemas/document.schema';
import type { ApiResponse, DocumentHeader } from '@/types';

// ---------------------------------------------------------------------------
// タスク 1E-01: createDocument
// ---------------------------------------------------------------------------

export async function createDocument(input: {
  documentType: 'estimate' | 'invoice';
  clientId: string;
  clientName: string;
  subject: string;
  issueDate: string;
  validUntil?: string;
  dueDate?: string;
  notes?: string;
  items: {
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    taxRate: 10 | 8 | 0;
  }[];
  createdBy: string;
}): Promise<ApiResponse<DocumentHeader>> {
  try {
    // documentCreateSchema はスキーマ定義上 clientName / createdBy を含まないため
    // それ以外のフィールドをバリデーションし、別途マージする
    const { clientName, createdBy, ...schemaInput } = input;

    const parsed = documentCreateSchema.safeParse(schemaInput);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容を確認してください',
          details: parsed.error.flatten() as Record<string, unknown>,
        },
      };
    }

    const result = await documentService.createDocument({
      ...parsed.data,
      clientName,
      createdBy,
    });

    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}

// ---------------------------------------------------------------------------
// updateDocument
// ---------------------------------------------------------------------------

export async function updateDocument(
  documentId: string,
  input: {
    subject?: string;
    issueDate?: string;
    validUntil?: string;
    dueDate?: string;
    notes?: string;
    items?: {
      itemName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      taxRate: 10 | 8 | 0;
    }[];
  },
): Promise<ApiResponse<DocumentHeader>> {
  try {
    const parsed = documentUpdateSchema.safeParse({ documentId, ...input });
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容を確認してください',
          details: parsed.error.flatten() as Record<string, unknown>,
        },
      };
    }

    const { documentId: _id, ...updates } = parsed.data;
    const result = await documentService.updateDocument(documentId, updates);

    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}

// ---------------------------------------------------------------------------
// deleteDocument
// ---------------------------------------------------------------------------

export async function deleteDocument(
  documentId: string,
): Promise<ApiResponse<void>> {
  try {
    await documentService.deleteDocument(documentId);
    return { success: true, data: undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}

// ---------------------------------------------------------------------------
// sendDocument
// ---------------------------------------------------------------------------

export async function sendDocument(
  documentId: string,
): Promise<ApiResponse<DocumentHeader>> {
  try {
    const result = await documentService.sendDocument(documentId);
    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}

// ---------------------------------------------------------------------------
// cancelDocument
// ---------------------------------------------------------------------------

export async function cancelDocument(
  documentId: string,
  cancelReason: string,
): Promise<ApiResponse<DocumentHeader>> {
  try {
    const parsed = documentCancelSchema.safeParse({ documentId, reason: cancelReason });
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容を確認してください',
          details: parsed.error.flatten() as Record<string, unknown>,
        },
      };
    }

    const result = await documentService.cancelDocument(documentId, parsed.data.reason);
    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}

// ---------------------------------------------------------------------------
// convertToInvoice
// ---------------------------------------------------------------------------

export async function convertToInvoice(
  estimateId: string,
  dueDate: string,
  createdBy: string,
): Promise<ApiResponse<DocumentHeader>> {
  try {
    const result = await documentService.convertToInvoice(estimateId, {
      dueDate,
      createdBy,
    });
    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}

// ---------------------------------------------------------------------------
// duplicateDocument
// ---------------------------------------------------------------------------

export async function duplicateDocument(
  documentId: string,
  createdBy: string,
): Promise<ApiResponse<DocumentHeader>> {
  try {
    const result = await documentService.duplicateDocument(documentId, createdBy);
    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}

// ---------------------------------------------------------------------------
// reviseEstimate
// ---------------------------------------------------------------------------

export async function reviseEstimate(
  estimateId: string,
  createdBy: string,
): Promise<ApiResponse<DocumentHeader>> {
  try {
    const result = await documentService.reviseEstimate(estimateId, createdBy);
    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : '予期しないエラーが発生しました';
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}
