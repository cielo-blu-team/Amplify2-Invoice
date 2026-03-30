'use strict';
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp();
}

const BATCH_SIZE = 500;

// Cloud Scheduler から HTTP POST でトリガー（毎日 8:00 JST）
exports.handler = async (_req, res) => {
  console.log('[OverdueChecker] Starting overdue check');

  const db = getFirestore();
  const today = new Date().toISOString().split('T')[0];

  try {
    const snap = await db
      .collection('documents')
      .where('dueDate', '<', today)
      .where('status', '==', 'sent')
      .where('isDeleted', '==', false)
      .get();

    console.log(`[OverdueChecker] 滞納候補: ${snap.docs.length}件`);

    const updatedAt = new Date().toISOString();
    const refs = snap.docs.map((d) => d.ref);

    for (let i = 0; i < refs.length; i += BATCH_SIZE) {
      const chunk = refs.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      for (const ref of chunk) {
        batch.update(ref, { status: 'overdue', updatedAt });
      }
      await batch.commit();
    }

    if (snap.docs.length > 0) {
      console.log(`[OverdueChecker] ${snap.docs.length}件を overdue に更新`);
    }

    // TODO: SLACK_WEBHOOK_URL を使った Slack 通知を実装

    res.status(200).json({ statusCode: 200, updated: snap.docs.length });
  } catch (e) {
    console.error('[OverdueChecker] Error:', e);
    res.status(500).json({ statusCode: 500, error: String(e) });
  }
};
