import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
export const createEstimateSchema = z.object({
    clientName: z.string().describe('取引先名（部分一致で自動解決）'),
    subject: z.string().describe('件名'),
    issueDate: z.string().describe('発行日 YYYY-MM-DD'),
    validUntil: z.string().optional().describe('有効期限 YYYY-MM-DD'),
    lineItems: z
        .array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        taxRate: z.union([z.literal(10), z.literal(8), z.literal(0)]),
    }))
        .describe('明細行'),
    notes: z.string().optional().describe('備考'),
    templateName: z.string().optional().describe('テンプレート名'),
});
export async function createEstimate(args, auth) {
    return apiCall('/api/mcp/documents', 'POST', {
        ...args,
        documentType: 'estimate',
        createdBy: auth.userId,
    }, auth.token);
}
//# sourceMappingURL=create-estimate.js.map