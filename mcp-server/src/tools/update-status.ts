import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const updateStatusSchema = z.object({
  documentId: z.string().describe('帳票ID'),
  newStatus: z
    .enum([
      'draft',
      'pending_approval',
      'approved',
      'rejected',
      'confirmed',
      'sent',
      'paid',
      'cancelled',
    ])
    .describe('新しいステータス'),
  comment: z.string().optional().describe('ステータス変更コメント'),
});

export async function updateStatus(
  args: z.infer<typeof updateStatusSchema>,
  auth: AuthContext,
) {
  const { documentId, ...body } = args;
  return apiCall(
    `/api/mcp/documents/${documentId}/status`,
    'POST',
    { ...body, updatedBy: auth.userId },
    auth.userId,
  );
}
