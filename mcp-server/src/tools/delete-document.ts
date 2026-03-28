import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const deleteDocumentSchema = z.object({
  documentId: z.string().describe('帳票ID'),
});

export async function deleteDocument(
  args: z.infer<typeof deleteDocumentSchema>,
  auth: AuthContext,
) {
  return apiCall(`/api/mcp/documents/${args.documentId}`, 'DELETE', undefined, auth.userId);
}
