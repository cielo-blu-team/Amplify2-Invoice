import type { ExpenseImportLog } from '@/types';
import { getFirestoreClient } from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

export async function createImportLog(log: ExpenseImportLog): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.IMPORT_LOGS)
    .doc(log.logId)
    .set(log);
}

export async function getLatestImportLog(): Promise<ExpenseImportLog | null> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.IMPORT_LOGS)
    .orderBy('importedAt', 'desc')
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data() as ExpenseImportLog;
}
