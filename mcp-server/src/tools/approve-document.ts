import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const approveDocumentSchema = z.object({
  documentId: z.string().describe('帳票ID'),
  action: z.enum(['approve', 'reject']).describe('承認アクション'),
  comment: z.string().optional().describe('承認・否認コメント（否認時は必須）'),
});

export async function approveDocument(
  args: z.infer<typeof approveDocumentSchema>,
  auth: AuthContext,
) {
  const { documentId, ...body } = args;
  return apiCall(
    `/api/mcp/documents/${documentId}/approve`,
    'POST',
    { ...body, approverId: auth.userId, approverName: auth.email },
    auth.userId,
  );
}
