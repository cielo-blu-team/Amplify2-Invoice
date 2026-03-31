'use server';

import { generatePdf } from '@/services/pdf.service';
import * as documentService from '@/services/document.service';
import * as documentRepo from '@/repositories/document.repository';
import * as settingsService from '@/services/settings.service';
import type { ApiResponse } from '@/types';

// pdf.service.ts は generatePdf(params) を export する関数スタイルのため、
// documentId から必要なデータを取得してラップするアダプターを定義する。
const pdfService = {
  async generateAndUpload(documentId: string): Promise<string> {
    const [doc, lineItems, settings] = await Promise.all([
      documentService.getDocument(documentId),
      documentRepo.getDocumentLineItems(documentId),
      settingsService.getCompanySettings(),
    ]);
    if (!doc) {
      throw new Error(`帳票が見つかりません: ${documentId}`);
    }
    if (!settings) {
      throw new Error('自社情報が設定されていません');
    }
    return generatePdf({ doc, lineItems, settings });
  },
};

export async function generatePdfAction(documentId: string): Promise<ApiResponse<{ pdfUrl: string }>> {
  try {
    const storageKey = await pdfService.generateAndUpload(documentId);
    // サーバー経由でダウンロード（signBlob 権限不要）
    const pdfUrl = `/api/pdf/download?key=${encodeURIComponent(storageKey)}`;
    return { success: true, data: { pdfUrl } };
  } catch (e) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'PDF生成に失敗しました',
      },
    };
  }
}
