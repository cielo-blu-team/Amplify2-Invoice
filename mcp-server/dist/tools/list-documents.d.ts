import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const listDocumentsSchema: z.ZodObject<{
    documentType: z.ZodOptional<z.ZodEnum<{
        estimate: "estimate";
        invoice: "invoice";
    }>>;
    status: z.ZodOptional<z.ZodString>;
    clientName: z.ZodOptional<z.ZodString>;
    fromDate: z.ZodOptional<z.ZodString>;
    toDate: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function listDocuments(args: z.infer<typeof listDocumentsSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=list-documents.d.ts.map