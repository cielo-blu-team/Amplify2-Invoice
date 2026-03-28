import { z } from 'zod';
import {
  postalCodeSchema,
  phoneSchema,
  emailSchema,
  registrationNumberSchema,
} from './common.schema';

// 自社情報更新スキーマ
export const companySettingsSchema = z.object({
  companyName: z.string().min(1, '会社名を入力してください').max(200),
  representativeName: z.string().min(1, '代表者名を入力してください').max(100),
  registrationNumber: registrationNumberSchema,
  postalCode: postalCodeSchema,
  address: z.string().min(1, '住所を入力してください').max(500),
  phone: phoneSchema,
  fax: phoneSchema.optional(),
  email: emailSchema,
  bankName: z.string().min(1, '銀行名を入力してください').max(100),
  branchName: z.string().min(1, '支店名を入力してください').max(100),
  accountType: z.enum(['ordinary', 'current']),
  accountNumber: z
    .string()
    .regex(/^\d{7}$/, '口座番号は7桁の数字で入力してください'),
  accountHolder: z.string().min(1, '口座名義を入力してください').max(100),
});
