import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const convertToInvoiceSchema: z.ZodObject<{
    documentId: z.ZodString;
    dueDate: z.ZodString;
}, z.core.$strip>;
export declare function convertToInvoice(args: z.infer<typeof convertToInvoiceSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=convert-to-invoice.d.ts.map