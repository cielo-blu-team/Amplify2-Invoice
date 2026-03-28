export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

class NotificationService {
  private webhookUrl = process.env.SLACK_WEBHOOK_URL ?? '';
  private botToken = process.env.SLACK_BOT_TOKEN ?? '';

  private async sendToSlack(message: SlackMessage): Promise<void> {
    if (!this.webhookUrl && !this.botToken) {
      console.warn('[NotificationService] Slack未設定のためスキップ');
      return;
    }
    const endpoint = this.botToken
      ? 'https://slack.com/api/chat.postMessage'
      : this.webhookUrl;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.botToken ? { Authorization: `Bearer ${this.botToken}` } : {}),
      },
      body: JSON.stringify(message),
    });
    if (!res.ok) throw new Error(`Slack送信失敗: ${res.statusText}`);
  }

  // 3A-02: 承認依頼通知（Block Kit）
  async notifyApprovalRequested(params: {
    documentId: string;
    documentNumber: string;
    documentType: 'estimate' | 'invoice';
    clientName: string;
    totalAmount: number;
    requestedBy: string;
    approverUserId: string;
    appBaseUrl: string;
  }): Promise<void> {
    const channel = process.env.SLACK_APPROVAL_CHANNEL ?? '#approvals';
    const docLabel = params.documentType === 'estimate' ? '見積書' : '請求書';
    const url = `${params.appBaseUrl}/approvals`;
    await this.sendToSlack({
      channel,
      text: `承認依頼: ${params.documentNumber}`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: `📋 承認依頼: ${docLabel}` } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*帳票番号:*\n${params.documentNumber}` },
            { type: 'mrkdwn', text: `*取引先:*\n${params.clientName}` },
            { type: 'mrkdwn', text: `*金額:*\n${params.totalAmount.toLocaleString('ja-JP')} 円` },
            { type: 'mrkdwn', text: `*依頼者:*\n${params.requestedBy}` },
          ],
        },
        {
          type: 'actions',
          elements: [
            { type: 'button', text: { type: 'plain_text', text: '承認画面を開く' }, style: 'primary', url },
          ],
        },
      ],
    });
  }

  // 3A-03: 承認完了通知
  async notifyApprovalResult(params: {
    documentId: string;
    documentNumber: string;
    action: 'approved' | 'rejected';
    comment?: string;
    approvedBy: string;
    requesterSlackId?: string;
  }): Promise<void> {
    const channel = params.requesterSlackId
      ? `@${params.requesterSlackId}`
      : (process.env.SLACK_APPROVAL_CHANNEL ?? '#approvals');
    const emoji = params.action === 'approved' ? '✅' : '❌';
    const label = params.action === 'approved' ? '承認されました' : '差戻しされました';
    await this.sendToSlack({
      channel,
      text: `${emoji} ${params.documentNumber} が${label}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *${params.documentNumber}* が${label}\n承認者: ${params.approvedBy}${params.comment ? `\nコメント: ${params.comment}` : ''}`,
          },
        },
      ],
    });
  }

  // 3A-04: 帳票作成完了通知（MCP経由作成時）
  async notifyDocumentCreated(params: {
    documentNumber: string;
    documentType: 'estimate' | 'invoice';
    clientName: string;
    totalAmount: number;
    createdBy: string;
    slackUserId?: string;
  }): Promise<void> {
    const channel = params.slackUserId
      ? `@${params.slackUserId}`
      : (process.env.SLACK_GENERAL_CHANNEL ?? '#general');
    const docLabel = params.documentType === 'estimate' ? '見積書' : '請求書';
    await this.sendToSlack({
      channel,
      text: `${docLabel}を作成しました: ${params.documentNumber}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📄 *${docLabel}作成完了*\n番号: ${params.documentNumber}\n取引先: ${params.clientName}\n金額: ${params.totalAmount.toLocaleString('ja-JP')} 円\n作成者: ${params.createdBy}`,
          },
        },
      ],
    });
  }

  // 期限アラート通知（3C-01）
  async notifyPaymentDeadline(params: {
    documentNumber: string;
    clientName: string;
    totalAmount: number;
    dueDate: string;
    daysUntilDue: number; // 7, 3, 0
  }): Promise<void> {
    const channel = process.env.SLACK_ALERT_CHANNEL ?? '#alerts';
    const urgency =
      params.daysUntilDue === 0
        ? '🚨 本日期限'
        : params.daysUntilDue <= 3
          ? '⚠️ 期限間近'
          : '📅 期限お知らせ';
    await this.sendToSlack({
      channel,
      text: `${urgency}: ${params.documentNumber} (${params.clientName})`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${urgency}\n請求書: *${params.documentNumber}*\n取引先: ${params.clientName}\n金額: ${params.totalAmount.toLocaleString('ja-JP')} 円\n支払期限: ${params.dueDate}（残${params.daysUntilDue}日）`,
          },
        },
      ],
    });
  }

  // 遅延発生通知（3C-02）
  async notifyOverdue(params: {
    documentNumber: string;
    clientName: string;
    totalAmount: number;
    dueDate: string;
  }): Promise<void> {
    const channel = process.env.SLACK_ALERT_CHANNEL ?? '#alerts';
    await this.sendToSlack({
      channel,
      text: `🔴 支払遅延: ${params.documentNumber} (${params.clientName})`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔴 *支払遅延発生*\n請求書: *${params.documentNumber}*\n取引先: ${params.clientName}\n金額: ${params.totalAmount.toLocaleString('ja-JP')} 円\n支払期限: ${params.dueDate}（期限超過）`,
          },
        },
      ],
    });
  }

  // 承認期限リマインド（3C-03）
  async notifyApprovalReminder(params: {
    documentNumber: string;
    requestedBy: string;
    hoursElapsed: number;
  }): Promise<void> {
    const channel = process.env.SLACK_APPROVAL_CHANNEL ?? '#approvals';
    await this.sendToSlack({
      channel,
      text: `⏰ 承認リマインド: ${params.documentNumber}（${params.hoursElapsed}時間経過）`,
    });
  }

  // 入金確認通知（3B-05）
  async notifyPaymentMatched(params: {
    documentNumber: string;
    clientName: string;
    amount: number;
    matchStatus: 'full' | 'partial' | 'mismatch';
  }): Promise<void> {
    const channel = process.env.SLACK_PAYMENT_CHANNEL ?? '#payments';
    const emoji =
      params.matchStatus === 'full' ? '✅' : params.matchStatus === 'partial' ? '⚠️' : '❓';
    const label =
      params.matchStatus === 'full'
        ? '入金確認'
        : params.matchStatus === 'partial'
          ? '一部入金'
          : '金額不一致';
    await this.sendToSlack({
      channel,
      text: `${emoji} ${label}: ${params.documentNumber}`,
    });
  }
}

export const notificationService = new NotificationService();
