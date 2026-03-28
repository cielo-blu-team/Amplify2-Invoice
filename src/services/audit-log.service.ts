import { v4 as uuidv4 } from 'uuid';
import * as auditLogRepo from '@/repositories/audit-log.repository';
import type { AuditLog } from '@/types';

// 監査ログ記録
export async function logAction(params: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  const logId = uuidv4();
  const timestamp = new Date().toISOString();
  const dateKey = timestamp.slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  const log: AuditLog = {
    PK: `LOG#${dateKey}`,
    SK: `${timestamp}#${logId}`,
    userId: params.userId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    details: params.details,
    ipAddress: params.ipAddress,
    timestamp,
  };

  await auditLogRepo.appendAuditLog(log);
}

// 監査ログ検索
export async function queryAuditLogs(params: {
  userId?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: AuditLog[]; cursor?: string }> {
  return auditLogRepo.queryAuditLogs(params);
}
