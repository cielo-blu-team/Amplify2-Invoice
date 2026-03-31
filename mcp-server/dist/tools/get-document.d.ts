import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const getDocumentSchema: z.ZodObject<{
    documentId: z.ZodString;
}, z.core.$strip>;
export declare function getDocument(args: z.infer<typeof getDocumentSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=get-document.d.ts.map