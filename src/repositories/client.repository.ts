import type { Client } from '@/types';
import {
  getFirestoreClient,
  applyCursorToQuery,
  generateNextCursor,
  stripLegacyFields,
  withUpdatedAt,
} from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

export async function getClientById(clientId: string): Promise<Client | null> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.CLIENTS).doc(clientId).get();
  if (!snap.exists) return null;
  return { ...snap.data(), clientId: snap.id } as Client;
}

export async function createClient(clientData: Client): Promise<void> {
  const db = getFirestoreClient();
  const docRef = db.collection(COLLECTIONS.CLIENTS).doc(clientData.clientId);

  await db.runTransaction(async (tx) => {
    if ((await tx.get(docRef)).exists) throw new Error(`Client ${clientData.clientId} already exists`);
    tx.set(docRef, stripLegacyFields(clientData, 'clientId'));
  });
}

export async function updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.CLIENTS)
    .doc(clientId)
    .update(withUpdatedAt(stripLegacyFields(updates, 'clientId')));
}

export async function softDeleteClient(clientId: string): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.CLIENTS)
    .doc(clientId)
    .update(withUpdatedAt({ isDeleted: true }));
}

/**
 * キーワード検索（clientName / clientNameKana の部分一致）
 * Firestore は全文検索非対応のためアプリ側フィルタを使用
 */
export async function searchClients(
  keyword: string,
  limit?: number,
  cursor?: string,
): Promise<{ items: Client[]; cursor?: string }> {
  const pageSize = limit ?? 20;

  let query = getFirestoreClient()
    .collection(COLLECTIONS.CLIENTS)
    .where('isDeleted', '==', false)
    .orderBy('clientNameKana', 'asc') as FirebaseFirestore.Query;

  query = await applyCursorToQuery(query, COLLECTIONS.CLIENTS, cursor);

  // Firestoreに部分一致がないため多めに取得してアプリ側フィルタ
  const snap = await query.limit(pageSize * 3).get();
  const filtered = snap.docs
    .map((d) => ({ ...d.data(), clientId: d.id }) as Client)
    .filter((c) => c.clientName?.includes(keyword) || c.clientNameKana?.includes(keyword));

  return {
    items: filtered.slice(0, pageSize),
    cursor: filtered.length > pageSize ? generateNextCursor(snap.docs, snap.docs.length) : undefined,
  };
}

export async function listClients(
  limit?: number,
  cursor?: string,
): Promise<{ items: Client[]; cursor?: string }> {
  const pageSize = limit ?? 20;

  let query = getFirestoreClient()
    .collection(COLLECTIONS.CLIENTS)
    .where('isDeleted', '==', false)
    .orderBy('clientNameKana', 'asc') as FirebaseFirestore.Query;

  query = await applyCursorToQuery(query, COLLECTIONS.CLIENTS, cursor);

  const snap = await query.limit(pageSize).get();
  return {
    items: snap.docs.map((d) => ({ ...d.data(), clientId: d.id }) as Client),
    cursor: generateNextCursor(snap.docs, pageSize),
  };
}
