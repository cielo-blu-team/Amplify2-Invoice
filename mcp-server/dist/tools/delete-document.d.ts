import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const deleteDocumentSchema: z.ZodObject<{
    documentId: z.ZodString;
}, z.core.$strip>;
export declare function deleteDocument(args: z.infer<typeof deleteDocumentSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=delete-document.d.ts.map