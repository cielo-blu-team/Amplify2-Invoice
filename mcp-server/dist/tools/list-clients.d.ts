import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const listClientsSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function listClients(args: z.infer<typeof listClientsSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=list-clients.d.ts.map