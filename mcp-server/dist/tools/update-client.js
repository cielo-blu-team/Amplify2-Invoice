import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
export const updateClientSchema = z.object({
    clientId: z.string().describe('取引先ID'),
    name: z.string().optional().describe('取引先名'),
    nameKana: z.string().optional().describe('取引先名（カナ）'),
    email: z.string().email().optional().describe('メールアドレス'),
    phone: z.string().optional().describe('電話番号'),
    address: z.string().optional().describe('住所'),
    zipCode: z.string().optional().describe('郵便番号'),
    contactPerson: z.string().optional().describe('担当者名'),
    notes: z.string().optional().describe('備考'),
});
export async function updateClient(args, auth) {
    const { clientId, ...updates } = args;
    return apiCall(`/api/mcp/clients/${clientId}`, 'PUT', updates, auth.token);
}
//# sourceMappingURL=update-client.js.map