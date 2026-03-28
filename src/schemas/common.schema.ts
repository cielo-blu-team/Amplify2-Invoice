import { z } from 'zod';

// ISO 8601 日付文字列
export const dateStringSchema = z.iso.date();

// ISO 8601 日時文字列
export const dateTimeStringSchema = z.iso.datetime();

// 金額（0以上の整数）
export const amountSchema = z.number().int().nonnegative();

// 正の数
export const positiveNumberSchema = z.number().positive();

// 税率
export const taxRateSchema = z.union([z.literal(10), z.literal(8), z.literal(0)]);

// 登録番号（T+13桁）
export const registrationNumberSchema = z
  .string()
  .regex(/^T\d{13}$/, '登録番号はT+13桁の数字で入力してください');

// 郵便番号
export const postalCodeSchema = z
  .string()
  .regex(/^\d{3}-?\d{4}$/, '郵便番号の形式が正しくありません');

// 電話番号
export const phoneSchema = z
  .string()
  .regex(/^[\d-]+$/, '電話番号の形式が正しくありません')
  .min(10)
  .max(15);

// メールアドレス
export const emailSchema = z.email('メールアドレスの形式が正しくありません');

// ページネーション
export const paginationSchema = z.object({
  limit: z.number().int().min(10).max(50).optional().default(20),
  cursor: z.string().optional(),
});
