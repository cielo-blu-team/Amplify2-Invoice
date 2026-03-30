import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const convertToInvoiceSchema = z.object({
  documentId: z.string().describe('変換元の見積書ID'),
  dueDate: z.string().describe('支払期限 YYYY-MM-DD'),
});

export async function convertToInvoice(
  args: z.infer<typeof convertToInvoiceSchema>,
  auth: AuthContext,
) {
  return apiCall(
    `/api/mcp/documents/${args.documentId}/convert`,
    'POST',
    { dueDate: args.dueDate, createdBy: auth.userId },
    auth.token,
  );
}
