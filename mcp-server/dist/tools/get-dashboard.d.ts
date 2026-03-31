import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const getDashboardSchema: z.ZodObject<{
    fromDate: z.ZodOptional<z.ZodString>;
    toDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function getDashboard(args: z.infer<typeof getDashboardSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=get-dashboard.d.ts.map