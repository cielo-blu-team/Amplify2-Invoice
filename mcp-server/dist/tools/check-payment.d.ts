import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const checkPaymentSchema: z.ZodObject<{
    invoiceId: z.ZodString;
}, z.core.$strip>;
export declare function checkPayment(args: z.infer<typeof checkPaymentSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=check-payment.d.ts.map