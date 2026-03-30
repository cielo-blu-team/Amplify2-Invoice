import type { Request, Response } from 'express';
import type { DocumentReference } from 'firebase-admin/firestore';
import { getDb } from '../../src/lib/firebase-admin';

const BATCH_SIZE = 500;

// Cloud Scheduler から HTTP POST でトリガー（毎日 8:00 JST）
// EventBridge overdue-checker の移行版
export const handler = async (_req: Request, res: Response) => {
  console.log('[OverdueChecker] Starting overdue check');

  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Firestore から dueDate < today && status = 'sent' の invoice を取得
    const snap = await db
      .collection('documents')
      .where('dueDate', '<', today)
      .where('status', '==', 'sent')
      .where('isDeleted', '==', false)
      .get();

    console.log(`[OverdueChecker] 滞納候補: ${snap.docs.length}件`);

    const updatedAt = new Date().toISOString();
    const refs = snap.docs.map((d) => d.ref as DocumentReference);

    // Firestore batch は 500件上限のためチャンク処理
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

    // TODO: Slack 通知送信
    // for (const doc of snap.docs) {
    //   await notifyOverdue({ documentId: doc.id, ...doc.data() });
    // }

    res.status(200).json({ statusCode: 200, updated: snap.docs.length });
  } catch (e) {
    console.error('[OverdueChecker] Error:', e);
    res.status(500).json({ statusCode: 500, error: String(e) });
  }
};
