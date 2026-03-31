import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from '@/lib/firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

let firestoreInstance: Firestore | null = null;

export function getFirestoreClient(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getDb();
    // undefined フィールドを無視（任意フィールドが undefined のままでもエラーにしない）
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
  }
  return firestoreInstance;
}

// --- カーソルページネーション ---

export function encodeCursor(documentId: string): string {
  return Buffer.from(documentId).toString('base64');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

export async function applyCursorToQuery(
  query: FirebaseFirestore.Query,
  collectionPath: string,
  cursor?: string,
): Promise<FirebaseFirestore.Query> {
  if (!cursor) return query;
  const lastSnap = await getFirestoreClient()
    .collection(collectionPath)
    .doc(decodeCursor(cursor))
    .get();
  return lastSnap.exists ? query.startAfter(lastSnap) : query;
}

export function generateNextCursor(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  limit: number,
): string | undefined {
  const lastDoc = docs[docs.length - 1];
  return lastDoc && docs.length === limit ? encodeCursor(lastDoc.id) : undefined;
}

// --- データ変換 ---

/**
 * DynamoDB 時代の PK/SK フィールドと任意の追加フィールドを除去する
 */
export function stripLegacyFields<T extends Record<string, unknown>>(
  data: T,
  ...extra: string[]
): Record<string, unknown> {
  const result = { ...data } as Record<string, unknown>;
  delete result['PK'];
  delete result['SK'];
  for (const key of extra) delete result[key];
  return result;
}

export function withUpdatedAt<T>(updates: T): T & { updatedAt: string } {
  return { ...updates, updatedAt: new Date().toISOString() } as T & { updatedAt: string };
}

// --- TTL ---

/** TTL 用 Firestore Timestamp を生成（n 日後） */
export function ttlTimestamp(days: number): Timestamp {
  return Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);
}

export const TTL_DAYS = {
  IDEMPOTENCY: 1,
  AUDIT_LOG: 7 * 365,
} as const;
