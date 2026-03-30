import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
import type { AuthContext } from '../middleware/auth.js';

export const createClientSchema = z.object({
  name: z.string().describe('取引先名'),
  nameKana: z.string().optional().describe('取引先名（カナ）'),
  email: z.string().email().optional().describe('メールアドレス'),
  phone: z.string().optional().describe('電話番号'),
  address: z.string().optional().describe('住所'),
  zipCode: z.string().optional().describe('郵便番号'),
  contactPerson: z.string().optional().describe('担当者名'),
  notes: z.string().optional().describe('備考'),
});

export async function createClient(
  args: z.infer<typeof createClientSchema>,
  auth: AuthContext,
) {
  return apiCall('/api/mcp/clients', 'POST', { ...args, createdBy: auth.userId }, auth.token);
}
