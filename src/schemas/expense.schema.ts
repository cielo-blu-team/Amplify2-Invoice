import { z } from 'zod';

export const expenseCategorySchema = z.enum([
  'transportation', 'communication', 'entertainment', 'consumables',
  'outsourcing', 'advertising', 'rent', 'insurance', 'tax',
  'utilities', 'equipment', 'other',
]);

export const paymentMethodSchema = z.enum([
  'cash', 'credit_card', 'bank_transfer', 'other',
]);

export const expenseCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付の形式が正しくありません'),
  vendor: z.string().min(1, '支払先を入力してください').max(200),
  description: z.string().min(1, '摘要を入力してください').max(500),
  amount: z.number().int().nonnegative('金額は0以上を入力してください'),
  category: expenseCategorySchema,
  subCategory: z.string().max(100).optional(),
  paymentMethod: paymentMethodSchema,
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  isAutoClassified: z.boolean().optional().default(false),
  source: z.enum(['manual', 'import']).optional().default('manual'),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();

export const ruleConditionSchema = z.object({
  field: z.enum(['vendor', 'description']),
  operator: z.enum(['contains', 'equals', 'starts_with', 'ends_with']),
  value: z.string().min(1, '条件値を入力してください').max(200),
});

export const expenseRuleCreateSchema = z.object({
  name: z.string().min(1, 'ルール名を入力してください').max(100),
  conditions: z.array(ruleConditionSchema).min(1, '条件を1件以上設定してください'),
  conditionLogic: z.enum(['AND', 'OR']),
  category: expenseCategorySchema,
  subCategory: z.string().max(100).optional(),
  priority: z.number().int().min(1).max(999).optional().default(100),
});

export const expenseRuleUpdateSchema = expenseRuleCreateSchema.partial();

// MCP/CSV インポート用の1行スキーマ
export const expenseImportRowSchema = z.object({
  date: z.string(),
  vendor: z.string(),
  description: z.string().optional().default(''),
  amount: z.union([z.number(), z.string().transform((v) => parseFloat(v.replace(/[^0-9.-]/g, '')))]),
  category: expenseCategorySchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
});
