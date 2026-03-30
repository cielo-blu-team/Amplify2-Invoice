import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const listClientsSchema = z.object({
  name: z.string().optional().describe('取引先名フィルタ（部分一致）'),
  limit: z.number().int().positive().max(100).optional().describe('取得件数（最大100）'),
  cursor: z.string().optional().describe('ページネーションカーソル'),
});

export async function listClients(
  args: z.infer<typeof listClientsSchema>,
  auth: AuthContext,
) {
  const params = new URLSearchParams();
  if (args.name) params.set('name', args.name);
  if (args.limit) params.set('limit', String(args.limit));
  if (args.cursor) params.set('cursor', args.cursor);

  const query = params.toString();
  const path = `/api/mcp/clients${query ? `?${query}` : ''}`;
  return apiCall(path, 'GET', undefined, auth.token);
}
