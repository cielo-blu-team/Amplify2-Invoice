import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const createInvoiceSchema: z.ZodObject<{
    clientName: z.ZodString;
    subject: z.ZodString;
    issueDate: z.ZodString;
    dueDate: z.ZodString;
    lineItems: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodUnion<readonly [z.ZodLiteral<10>, z.ZodLiteral<8>, z.ZodLiteral<0>]>;
    }, z.core.$strip>>;
    notes: z.ZodOptional<z.ZodString>;
    templateName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function createInvoice(args: z.infer<typeof createInvoiceSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=create-invoice.d.ts.map