import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const updateDocumentSchema: z.ZodObject<{
    documentId: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodUnion<readonly [z.ZodLiteral<10>, z.ZodLiteral<8>, z.ZodLiteral<0>]>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare function updateDocument(args: z.infer<typeof updateDocumentSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=update-document.d.ts.map