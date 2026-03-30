import type { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreClient, ttlTimestamp, TTL_DAYS } from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

export async function saveIdempotencyKey(key: string, responseData: unknown): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.IDEMPOTENCY_KEYS)
    .doc(key)
    .set({ key, responseData, createdAt: new Date().toISOString(), expiresAt: ttlTimestamp(TTL_DAYS.IDEMPOTENCY) });
}

export async function getIdempotencyKey(key: string): Promise<{ responseData: unknown } | null> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.IDEMPOTENCY_KEYS).doc(key).get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  // Firestore TTL の遅延削除に備え expiresAt を明示チェック
  if ((data.expiresAt as Timestamp).toMillis() < Date.now()) return null;

  return { responseData: data.responseData };
}
