import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const checkPaymentSchema = z.object({
  invoiceId: z.string().describe('請求書ID'),
});

export async function checkPayment(
  args: z.infer<typeof checkPaymentSchema>,
  auth: AuthContext,
) {
  return apiCall(
    '/api/mcp/payments/check',
    'POST',
    { invoiceId: args.invoiceId, requestedBy: auth.userId },
    auth.token,
  );
}
