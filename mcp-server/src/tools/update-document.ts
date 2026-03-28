import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const updateDocumentSchema = z.object({
  documentId: z.string().describe('帳票ID'),
  subject: z.string().optional().describe('件名'),
  issueDate: z.string().optional().describe('発行日 YYYY-MM-DD'),
  validUntil: z.string().optional().describe('有効期限 YYYY-MM-DD'),
  dueDate: z.string().optional().describe('支払期限 YYYY-MM-DD'),
  notes: z.string().optional().describe('備考'),
  lineItems: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        taxRate: z.union([z.literal(10), z.literal(8), z.literal(0)]),
      }),
    )
    .optional()
    .describe('明細行'),
});

export async function updateDocument(
  args: z.infer<typeof updateDocumentSchema>,
  auth: AuthContext,
) {
  const { documentId, ...updates } = args;
  return apiCall(`/api/mcp/documents/${documentId}`, 'PUT', updates, auth.userId);
}
