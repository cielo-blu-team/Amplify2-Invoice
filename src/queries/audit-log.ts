// Server-side data fetching（Server Component から呼ぶ）
// 'use server' ディレクティブは不要（queries/ は Server Component から直接呼ぶ）

import * as auditLogService from '@/services/audit-log.service';
import type { AuditLog } from '@/types';

// ---------------------------------------------------------------------------
// タスク 1E-10: 監査ログ取得クエリ
// ---------------------------------------------------------------------------

/**
 * 監査ログを検索・取得する
 */
export async function getAuditLogs(params: {
  userId?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: AuditLog[]; cursor?: string }> {
  return auditLogService.queryAuditLogs(params);
}
