// EventBridge 毎朝9:00 — 7日前/3日前/当日のアラート
export const handler = async () => {
  console.log('[NotificationScheduler] Starting deadline check');
  const today = new Date();
  const alertDays = [7, 3, 0];
  for (const days of alertDays) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    // TODO: DynamoDBからdueDate = targetDateStr && status = 'sent'のinvoiceを取得
    // await notificationService.notifyPaymentDeadline({ ..., daysUntilDue: days })
    console.log(`[NotificationScheduler] ${days}日前アラート確認: ${targetDateStr}`);
  }
  return { statusCode: 200 };
};
