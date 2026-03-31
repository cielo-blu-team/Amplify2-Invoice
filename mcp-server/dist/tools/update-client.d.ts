import { z } from 'zod';
import type { AuthContext } from '../middleware/auth.js';
export declare const updateClientSchema: z.ZodObject<{
    clientId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    nameKana: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    zipCode: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function updateClient(args: z.infer<typeof updateClientSchema>, auth: AuthContext): Promise<unknown>;
//# sourceMappingURL=update-client.d.ts.map