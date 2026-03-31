import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const updateStatusSchema: z.ZodObject<{
    documentId: z.ZodString;
    newStatus: z.ZodEnum<{
        draft: "draft";
        pending_approval: "pending_approval";
        approved: "approved";
        rejected: "rejected";
        confirmed: "confirmed";
        sent: "sent";
        paid: "paid";
        cancelled: "cancelled";
    }>;
    comment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function updateStatus(args: z.infer<typeof updateStatusSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=update-status.d.ts.map