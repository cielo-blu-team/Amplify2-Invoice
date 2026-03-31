import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
export const checkPaymentSchema = z.object({
    invoiceId: z.string().describe('請求書ID'),
});
export async function checkPayment(args, auth) {
    return apiCall('/api/mcp/payments/check', 'POST', { invoiceId: args.invoiceId, requestedBy: auth.userId }, auth.token);
}
//# sourceMappingURL=check-payment.js.map