import type { AuditLog } from '@/types';
import {
  getFirestoreClient,
  applyCursorToQuery,
  generateNextCursor,
  stripLegacyFields,
  ttlTimestamp,
  TTL_DAYS,
} from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

function toDateKey(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toISOString().substring(0, 10).replace(/-/g, '');
}

export async function appendAuditLog(log: AuditLog): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.AUDIT_LOGS)
    .add({
      ...stripLegacyFields(log, 'ttl'),
      date: toDateKey(log.timestamp),
      expiresAt: ttlTimestamp(TTL_DAYS.AUDIT_LOG),
    });
}

export async function queryAuditLogs(params: {
  userId?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: AuditLog[]; cursor?: string }> {
  const pageSize = params.limit ?? 50;

  let query: FirebaseFirestore.Query = getFirestoreClient().collection(COLLECTIONS.AUDIT_LOGS);

  if (params.userId) {
    query = query.where('userId', '==', params.userId).orderBy('timestamp', 'desc');
  } else if (params.resourceId) {
    query = query.where('resourceId', '==', params.resourceId).orderBy('timestamp', 'desc');
  } else {
    query = query.where('date', '==', toDateKey(params.dateFrom)).orderBy('timestamp', 'desc');
  }

  if (params.dateTo) {
    query = query.where('timestamp', '<=', `${params.dateTo}T23:59:59.999Z`);
  }

  query = await applyCursorToQuery(query, COLLECTIONS.AUDIT_LOGS, params.cursor);

  const snap = await query.limit(pageSize).get();
  const items = snap.docs.map((d) => {
    const { expiresAt: _exp, date: _date, ...logData } = d.data();
    return logData as AuditLog;
  });

  return { items, cursor: generateNextCursor(snap.docs, pageSize) };
}
