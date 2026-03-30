import type { Request, Response } from 'express';
import { getDb } from '../../src/lib/firebase-admin';

// Cloud Scheduler から HTTP POST でトリガー（毎朝 9:00 JST）
// EventBridge notification-scheduler の移行版
export const handler = async (_req: Request, res: Response) => {
  console.log('[NotificationScheduler] Starting deadline check');

  const db = getDb();
  const today = new Date();
  const alertDays = [7, 3, 0];

  for (const days of alertDays) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    try {
      // Firestore から dueDate = targetDateStr && status = 'sent' の invoice を取得
      const snap = await db
        .collection('documents')
        .where('dueDate', '==', targetDateStr)
        .where('status', '==', 'sent')
        .where('isDeleted', '==', false)
        .get();

      console.log(
        `[NotificationScheduler] ${days}日前アラート確認: ${targetDateStr} — ${snap.docs.length}件`
      );

      // TODO: Slack 通知送信
      // for (const doc of snap.docs) {
      //   const data = doc.data();
      //   await notifyPaymentDeadline({ documentId: doc.id, ...data, daysUntilDue: days });
      // }
    } catch (e) {
      console.error(`[NotificationScheduler] Error for ${targetDateStr}:`, e);
    }
  }

  res.status(200).json({ statusCode: 200 });
};
