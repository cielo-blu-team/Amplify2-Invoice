import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const approveDocumentSchema: z.ZodObject<{
    documentId: z.ZodString;
    action: z.ZodEnum<{
        approve: "approve";
        reject: "reject";
    }>;
    comment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function approveDocument(args: z.infer<typeof approveDocumentSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=approve-document.d.ts.map