import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const createEstimateSchema: z.ZodObject<{
    clientName: z.ZodString;
    subject: z.ZodString;
    issueDate: z.ZodString;
    validUntil: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodUnion<readonly [z.ZodLiteral<10>, z.ZodLiteral<8>, z.ZodLiteral<0>]>;
    }, z.core.$strip>>;
    notes: z.ZodOptional<z.ZodString>;
    templateName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function createEstimate(args: z.infer<typeof createEstimateSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=create-estimate.d.ts.map