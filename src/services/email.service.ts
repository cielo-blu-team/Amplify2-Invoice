/**
 * メール送信サービス（無効化 — Slack通知のみ使用）
 * GCP移行にともないメール送信機能を廃止
 * 代わりに NotificationService の Slack 通知を使用してください
 */

export interface SendDocumentEmailParams {
  to: string[];
  cc?: string[];
  documentId: string;
  documentNumber: string;
  documentType: 'estimate' | 'invoice';
  clientName: string;
  totalAmount: number;
  pdfUrl: string;
  senderName: string;
  senderEmail: string;
}

class EmailService {
  async sendDocumentEmail(_params: SendDocumentEmailParams): Promise<void> {
    console.warn('[EmailService] メール送信は無効化されています。Slack通知を使用してください。');
  }
}

export const emailService = new EmailService();
