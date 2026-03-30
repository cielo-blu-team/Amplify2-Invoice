import type {
  DocumentHeader,
  LineItem,
  ApprovalRecord,
  DocumentListFilters,
  DocumentStatus,
} from '@/types';
import {
  getFirestoreClient,
  encodeCursor,
  applyCursorToQuery,
  generateNextCursor,
  stripLegacyFields,
  withUpdatedAt,
} from './_firestore-client';
import { COLLECTIONS, SUBCOLLECTIONS } from '@/lib/constants';

export async function getDocumentById(documentId: string): Promise<DocumentHeader | null> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.DOCUMENTS).doc(documentId).get();
  if (!snap.exists) return null;
  return { ...snap.data(), documentId: snap.id } as DocumentHeader;
}

export async function getDocumentLineItems(documentId: string): Promise<LineItem[]> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.DOCUMENTS)
    .doc(documentId)
    .collection(SUBCOLLECTIONS.LINE_ITEMS)
    .orderBy('sortOrder', 'asc')
    .get();
  return snap.docs.map((d) => ({ ...d.data(), lineItemId: d.id }) as LineItem);
}

export async function createDocument(header: DocumentHeader, lineItems: LineItem[]): Promise<void> {
  const db = getFirestoreClient();
  const docRef = db.collection(COLLECTIONS.DOCUMENTS).doc(header.documentId);

  await db.runTransaction(async (tx) => {
    if ((await tx.get(docRef)).exists) {
      throw new Error(`Document ${header.documentId} already exists`);
    }
    tx.set(docRef, stripLegacyFields(header, 'documentId'));

    for (const item of lineItems) {
      const lineItemId =
        (item as LineItem & { lineItemId?: string }).lineItemId ??
        item.SK?.replace('ITEM#', '') ??
        db.collection('_').doc().id;
      tx.set(
        docRef.collection(SUBCOLLECTIONS.LINE_ITEMS).doc(lineItemId),
        stripLegacyFields(item, 'lineItemId'),
      );
    }
  });
}

export async function updateDocumentMeta(
  documentId: string,
  updates: Partial<DocumentHeader>,
): Promise<void> {
  const db = getFirestoreClient();
  const docRef = db.collection(COLLECTIONS.DOCUMENTS).doc(documentId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) throw new Error(`Document ${documentId} not found`);
    if (snap.data()?.status !== 'draft') throw new Error('draft ステータスの帳票のみ更新できます');
    tx.update(docRef, withUpdatedAt(stripLegacyFields(updates, 'documentId')));
  });
}

export async function softDeleteDocument(documentId: string): Promise<void> {
  const db = getFirestoreClient();
  const docRef = db.collection(COLLECTIONS.DOCUMENTS).doc(documentId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) throw new Error(`Document ${documentId} not found`);
    if (snap.data()?.status !== 'draft') throw new Error('draft ステータスの帳票のみ削除できます');
    tx.update(docRef, withUpdatedAt({ isDeleted: true }));
  });
}

export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
  additionalUpdates?: Partial<DocumentHeader>,
): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.DOCUMENTS)
    .doc(documentId)
    .update(withUpdatedAt({ status, ...stripLegacyFields(additionalUpdates ?? {}, 'documentId') }));
}

export async function addApprovalRecord(
  documentId: string,
  record: Omit<ApprovalRecord, 'PK' | 'SK'>,
): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.DOCUMENTS)
    .doc(documentId)
    .collection(SUBCOLLECTIONS.APPROVALS)
    .doc(record.timestamp)
    .set(record);
}

export async function getApprovalHistory(documentId: string): Promise<ApprovalRecord[]> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.DOCUMENTS)
    .doc(documentId)
    .collection(SUBCOLLECTIONS.APPROVALS)
    .orderBy('timestamp', 'asc')
    .get();
  return snap.docs.map((d) => d.data() as ApprovalRecord);
}

export async function listDocuments(filters: DocumentListFilters): Promise<{
  items: DocumentHeader[];
  cursor?: string;
}> {
  const limit = filters.limit ?? 20;

  let query = getFirestoreClient()
    .collection(COLLECTIONS.DOCUMENTS)
    .where('isDeleted', '==', false) as FirebaseFirestore.Query;

  if (filters.status?.length === 1) {
    query = query.where('status', '==', filters.status[0]).orderBy('issueDate', 'desc');
  } else if (filters.status && filters.status.length > 1) {
    query = query.where('status', 'in', filters.status).orderBy('issueDate', 'desc');
  } else if (filters.clientId) {
    query = query.where('clientId', '==', filters.clientId).orderBy('issueDate', 'desc');
  } else if (filters.documentType) {
    query = query.where('documentType', '==', filters.documentType).orderBy('issueDate', 'desc');
  } else if (filters.createdBy) {
    query = query.where('createdBy', '==', filters.createdBy).orderBy('createdAt', 'desc');
  } else {
    query = query.orderBy('issueDate', 'desc');
  }

  if (filters.issueDateFrom) query = query.where('issueDate', '>=', filters.issueDateFrom);
  if (filters.issueDateTo) query = query.where('issueDate', '<=', filters.issueDateTo);

  query = await applyCursorToQuery(query, COLLECTIONS.DOCUMENTS, filters.cursor);

  const snap = await query.limit(limit).get();
  let items = snap.docs.map((d) => ({ ...d.data(), documentId: d.id }) as DocumentHeader);

  // Firestore の不等号制限により金額・名前・番号はアプリ側でフィルタ
  if (filters.amountMin !== undefined) items = items.filter((i) => (i.totalAmount ?? 0) >= filters.amountMin!);
  if (filters.amountMax !== undefined) items = items.filter((i) => (i.totalAmount ?? 0) <= filters.amountMax!);
  if (filters.clientName) items = items.filter((i) => i.clientName?.includes(filters.clientName!));
  if (filters.documentNumber) items = items.filter((i) => i.documentNumber?.includes(filters.documentNumber!));

  return { items, cursor: generateNextCursor(snap.docs, limit) };
}

export async function listDocumentsByClientId(
  clientId: string,
  limit?: number,
  cursor?: string,
): Promise<{ items: DocumentHeader[]; cursor?: string }> {
  const pageSize = limit ?? 20;

  let query = getFirestoreClient()
    .collection(COLLECTIONS.DOCUMENTS)
    .where('clientId', '==', clientId)
    .where('isDeleted', '==', false)
    .orderBy('issueDate', 'desc') as FirebaseFirestore.Query;

  query = await applyCursorToQuery(query, COLLECTIONS.DOCUMENTS, cursor);

  const snap = await query.limit(pageSize).get();
  return {
    items: snap.docs.map((d) => ({ ...d.data(), documentId: d.id }) as DocumentHeader),
    cursor: generateNextCursor(snap.docs, pageSize),
  };
}
