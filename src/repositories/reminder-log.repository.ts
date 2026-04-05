import type { PaymentReminderLog, ReminderType } from '@/types';
import { getFirestoreClient } from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

export async function createReminderLog(log: PaymentReminderLog): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.REMINDER_LOGS)
    .doc(log.logId)
    .set(log);
}

/**
 * 指定した帳票 × 通知タイプの送信済みログが存在するかチェック
 */
export async function hasReminderBeenSent(
  documentId: string,
  reminderType: ReminderType,
): Promise<boolean> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.REMINDER_LOGS)
    .where('documentId', '==', documentId)
    .where('reminderType', '==', reminderType)
    .limit(1)
    .get();
  return !snap.empty;
}
