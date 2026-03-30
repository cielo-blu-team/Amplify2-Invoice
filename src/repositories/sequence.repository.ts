import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreClient } from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

export async function getNextSequence(type: 'EST' | 'INV', date: string): Promise<number> {
  const db = getFirestoreClient();
  const ref = db.collection(COLLECTIONS.SEQUENCES).doc(`${type}_${date}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = (snap.data()?.counter ?? 0) + 1;
    tx.set(ref, { counter: next, lastUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return next;
  });
}
