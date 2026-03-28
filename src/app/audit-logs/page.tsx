export const dynamic = 'force-dynamic';
import { getAuditLogs } from '@/queries/audit-log';
import AuditLogClient from './AuditLogClient';

export default async function AuditLogPage() {
  const logs = await getAuditLogs({ limit: 50 }).catch(() => ({ items: [], cursor: undefined }));
  return <AuditLogClient initialData={logs} />;
}
