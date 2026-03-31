import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import { authorize } from '../middleware/rbac.js';
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
export async function updateStatus(args, auth) {
    // sent/cancelled 遷移は accountant/admin のみ（設計書 §6.2）
    if (args.newStatus === 'sent')
        authorize('document:send', auth);
    if (args.newStatus === 'cancelled')
        authorize('document:cancel', auth);
    const { documentId, ...body } = args;
    return apiCall(`/api/mcp/documents/${documentId}/status`, 'POST', { ...body, updatedBy: auth.userId }, auth.token);
}
//# sourceMappingURL=update-status.js.map