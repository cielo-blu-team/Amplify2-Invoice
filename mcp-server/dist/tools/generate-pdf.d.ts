import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const generatePdfSchema: z.ZodObject<{
    documentId: z.ZodString;
}, z.core.$strip>;
export declare function generatePdf(args: z.infer<typeof generatePdfSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=generate-pdf.d.ts.map