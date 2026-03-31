import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const createClientSchema: z.ZodObject<{
    name: z.ZodString;
    nameKana: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    zipCode: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function createClient(args: z.infer<typeof createClientSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=create-client.d.ts.map