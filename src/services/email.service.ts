// src/services/email.service.ts
// AWS SES連携でPDF添付メール送信

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
  private fromEmail = process.env.SES_FROM_EMAIL ?? 'noreply@example.com';
  private region = process.env.AWS_REGION ?? 'ap-northeast-1';

  async sendDocumentEmail(params: SendDocumentEmailParams): Promise<void> {
    // TODO: AWS SES SDK (@aws-sdk/client-ses) での実装
    // const ses = new SESClient({ region: this.region });
    // const pdfBuffer = await fetch(params.pdfUrl).then(r => r.arrayBuffer());
    // await ses.send(new SendRawEmailCommand({ ... }));

    if (!process.env.SES_FROM_EMAIL) {
      console.warn('[EmailService] SES_FROM_EMAIL未設定 - メール送信をスキップ');
      return;
    }

    const docLabel = params.documentType === 'estimate' ? '見積書' : '請求書';
    console.log(`[EmailService] 送信: ${docLabel} ${params.documentNumber} → ${params.to.join(', ')}`);

    // SES実装のテンプレート（実装時に使用）
    const subject = `【${params.senderName}】${docLabel}をお送りします（${params.documentNumber}）`;
    const body = `
${params.clientName} ご担当者様

いつもお世話になっております。
${params.senderName}の${params.senderName}でございます。

${docLabel}をお送りします。ご確認のほどよろしくお願いいたします。

----
帳票番号: ${params.documentNumber}
取引先: ${params.clientName}
金額: ${params.totalAmount.toLocaleString('ja-JP')} 円
----

PDFはこちら: ${params.pdfUrl}

${params.senderName}
${params.senderEmail}
    `.trim();

    // 実際のSES送信コードはここに実装
    console.log('[EmailService] Email prepared:', { subject, to: params.to });
  }
}

export const emailService = new EmailService();
