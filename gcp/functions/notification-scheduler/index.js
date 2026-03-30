'use strict';
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp();
}

// Cloud Scheduler から HTTP POST でトリガー（毎朝 9:00 JST）
exports.handler = async (_req, res) => {
  console.log('[NotificationScheduler] Starting deadline check');

  const db = getFirestore();
  const today = new Date();
  const alertDays = [7, 3, 0];

  for (const days of alertDays) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    try {
      const snap = await db
        .collection('documents')
        .where('dueDate', '==', targetDateStr)
        .where('status', '==', 'sent')
        .where('isDeleted', '==', false)
        .get();

      console.log(`[NotificationScheduler] ${days}日前アラート: ${targetDateStr} — ${snap.docs.length}件`);
      // TODO: SLACK_WEBHOOK_URL を使った Slack 通知を実装
    } catch (e) {
      console.error(`[NotificationScheduler] Error for ${targetDateStr}:`, e);
    }
  }

  res.status(200).json({ statusCode: 200 });
};
