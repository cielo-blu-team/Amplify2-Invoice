import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const generatePdfSchema = z.object({
  documentId: z.string().describe('帳票ID'),
});

export async function generatePdf(
  args: z.infer<typeof generatePdfSchema>,
  auth: AuthContext,
) {
  return apiCall(
    `/api/mcp/documents/${args.documentId}/pdf`,
    'POST',
    undefined,
    auth.userId,
  );
}
