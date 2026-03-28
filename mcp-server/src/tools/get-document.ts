import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const getDocumentSchema = z.object({
  documentId: z.string().describe('帳票ID'),
});

export async function getDocument(
  args: z.infer<typeof getDocumentSchema>,
  auth: AuthContext,
) {
  return apiCall(`/api/mcp/documents/${args.documentId}`, 'GET', undefined, auth.userId);
}
