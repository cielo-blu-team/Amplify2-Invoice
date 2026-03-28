import { z } from 'zod';
import {
  postalCodeSchema,
  phoneSchema,
  emailSchema,
  registrationNumberSchema,
} from './common.schema';

// 取引先作成スキーマ
export const clientCreateSchema = z.object({
  clientName: z.string().min(1, '取引先名を入力してください').max(200),
  clientNameKana: z.string().max(200).optional(),
  businessType: z.enum(['corporation', 'individual', 'other']),
  registrationNumber: registrationNumberSchema.optional(),
  postalCode: postalCodeSchema.optional(),
  prefecture: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  building: z.string().max(200).optional(),
  phone: phoneSchema.optional(),
  fax: phoneSchema.optional(),
  email: emailSchema.optional(),
  contactPerson: z.string().max(100).optional(),
  contactEmail: emailSchema.optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  paymentTerms: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

// 取引先更新スキーマ
export const clientUpdateSchema = clientCreateSchema.partial().extend({
  clientId: z.string().min(1),
});

// 取引先検索スキーマ
export const clientSearchSchema = z.object({
  keyword: z.string().optional(),
  limit: z.number().int().min(10).max(50).optional().default(20),
  cursor: z.string().optional(),
});
