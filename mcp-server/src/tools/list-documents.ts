import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const listDocumentsSchema = z.object({
  documentType: z
    .enum(['estimate', 'invoice'])
    .optional()
    .describe('帳票種別フィルタ'),
  status: z
    .string()
    .optional()
    .describe('ステータスフィルタ（カンマ区切りで複数指定可）'),
  clientName: z.string().optional().describe('取引先名フィルタ（部分一致）'),
  fromDate: z.string().optional().describe('発行日From YYYY-MM-DD'),
  toDate: z.string().optional().describe('発行日To YYYY-MM-DD'),
  limit: z.number().int().positive().max(100).optional().describe('取得件数（最大100）'),
  cursor: z.string().optional().describe('ページネーションカーソル'),
});

export async function listDocuments(
  args: z.infer<typeof listDocumentsSchema>,
  auth: AuthContext,
) {
  const params = new URLSearchParams();
  if (args.documentType) params.set('documentType', args.documentType);
  if (args.status) params.set('status', args.status);
  if (args.clientName) params.set('clientName', args.clientName);
  if (args.fromDate) params.set('fromDate', args.fromDate);
  if (args.toDate) params.set('toDate', args.toDate);
  if (args.limit) params.set('limit', String(args.limit));
  if (args.cursor) params.set('cursor', args.cursor);

  const query = params.toString();
  const path = `/api/mcp/documents${query ? `?${query}` : ''}`;
  return apiCall(path, 'GET', undefined, auth.userId);
}
