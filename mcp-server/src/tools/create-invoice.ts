import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const createInvoiceSchema = z.object({
  clientName: z.string().describe('取引先名（部分一致で自動解決）'),
  subject: z.string().describe('件名'),
  issueDate: z.string().describe('発行日 YYYY-MM-DD'),
  dueDate: z.string().describe('支払期限 YYYY-MM-DD'),
  lineItems: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        taxRate: z.union([z.literal(10), z.literal(8), z.literal(0)]),
      }),
    )
    .describe('明細行'),
  notes: z.string().optional().describe('備考'),
  templateName: z.string().optional().describe('テンプレート名'),
});

export async function createInvoice(
  args: z.infer<typeof createInvoiceSchema>,
  auth: AuthContext,
) {
  return apiCall('/api/mcp/documents', 'POST', {
    ...args,
    documentType: 'invoice',
    createdBy: auth.userId,
  }, auth.token);
}
