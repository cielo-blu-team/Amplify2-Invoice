'use server';
import type { ApiResponse } from '@/types';

// メール送信は廃止済み — Slack通知に移行済み
export async function sendDocumentByEmail(
  _documentId: string,
  _toEmails: string[],
): Promise<ApiResponse<void>> {
  return {
    success: false,
    error: {
      code: 'NOT_SUPPORTED',
      message: 'メール送信機能は廃止されました。Slack通知をご利用ください。',
    },
  };
}
