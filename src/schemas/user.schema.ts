import { z } from 'zod';
import { emailSchema } from './common.schema';

// ユーザー作成スキーマ
export const userCreateSchema = z.object({
  email: emailSchema,
  displayName: z.string().min(1, '表示名を入力してください').max(100),
  role: z.enum(['user', 'accountant', 'admin']),
});

// ユーザー更新スキーマ
export const userUpdateSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1).max(100).optional(),
  role: z.enum(['user', 'accountant', 'admin']).optional(),
  slackUserId: z.string().max(50).optional(),
});

// 通知設定スキーマ
export const notificationSettingsSchema = z.object({
  approval_request: z.boolean(),
  approval_result: z.boolean(),
  payment_result: z.boolean(),
  payment_alert_7d: z.boolean(),
  payment_alert_3d: z.boolean(),
  payment_alert_today: z.boolean(),
  overdue: z.boolean(),
  document_created: z.boolean(),
});

// 通知設定更新スキーマ
export const updateNotificationSettingsSchema = z.object({
  userId: z.string().min(1),
  settings: notificationSettingsSchema,
});
