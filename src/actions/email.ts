'use server';
import { emailService } from '@/services/email.service';
import type { ApiResponse } from '@/types';

export async function sendDocumentByEmail(
  documentId: string,
  toEmails: string[],
): Promise<ApiResponse<void>> {
  try {
    // TODO: documentServiceからデータ取得
    // const doc = await getDocument(documentId);
    await emailService.sendDocumentEmail({
      to: toEmails,
      documentId,
      documentNumber: documentId,
      documentType: 'invoice',
      clientName: '取引先',
      totalAmount: 0,
      pdfUrl: '',
      senderName: '株式会社IS Holdings',
      senderEmail: process.env.SES_FROM_EMAIL ?? 'noreply@example.com',
    });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'メール送信に失敗しました' } };
  }
}
