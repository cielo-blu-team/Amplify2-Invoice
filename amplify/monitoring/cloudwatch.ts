// CloudWatch Logs / Metrics / Alarms 設定
// amplify/monitoring/cloudwatch.ts

export const cloudwatchConfig = {
  // 4E-01: ロググループ設定
  logGroups: {
    application: '/amplify2-invoice/app',
    accessLogs: '/amplify2-invoice/access',
    errorLogs: '/amplify2-invoice/errors',
    auditLogs: '/amplify2-invoice/audit',
  },

  // メトリクス定義
  metrics: {
    documentCreated: { namespace: 'Invoice/Documents', metricName: 'DocumentCreated' },
    pdfGenerated: { namespace: 'Invoice/PDF', metricName: 'PDFGenerated' },
    approvalRequested: { namespace: 'Invoice/Approval', metricName: 'ApprovalRequested' },
    paymentMatched: { namespace: 'Invoice/Payment', metricName: 'PaymentMatched' },
    errorRate: { namespace: 'Invoice/Errors', metricName: 'ErrorRate' },
  },

  // 4E-02: アラーム定義（SNS → Slack通知）
  alarms: [
    {
      name: 'HighErrorRate',
      description: 'エラー率が5%を超過',
      metric: 'ErrorRate',
      threshold: 5,
      evaluationPeriods: 2,
      snsTopicArn: process.env.ALERT_SNS_TOPIC_ARN,
    },
    {
      name: 'PDFGenerationFailure',
      description: 'PDF生成失敗が10件/分を超過',
      metric: 'PDFGenerationError',
      threshold: 10,
      evaluationPeriods: 1,
      snsTopicArn: process.env.ALERT_SNS_TOPIC_ARN,
    },
  ],

  // 4E-03: データライフサイクル設定
  lifecycle: {
    s3: {
      intelligentTiering: 30,    // 30日後: Intelligent-Tiering
      glacier: 365,              // 1年後: Glacier
      deepArchive: 365 * 7,      // 7年後: Glacier Deep Archive (電帳法)
    },
    dynamodb: {
      auditLogRetentionDays: 365 * 7,   // 7年保持 (TTL)
      idempotencyKeyRetentionDays: 1,    // 24時間
    },
  },
};

// CloudWatch カスタムメトリクス送信ユーティリティ
export async function putMetric(metricName: string, value: number, unit: 'Count' | 'Seconds' = 'Count'): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return; // 本番のみ
  try {
    // TODO: @aws-sdk/client-cloudwatch での実装
    // const cw = new CloudWatchClient({ region: process.env.AWS_REGION });
    // await cw.send(new PutMetricDataCommand({ ... }));
    console.log(`[Metrics] ${metricName}: ${value} ${unit}`);
  } catch (e) {
    console.error('[Metrics] Failed to put metric:', e);
  }
}
