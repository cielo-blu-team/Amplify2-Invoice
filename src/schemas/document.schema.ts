import { z } from 'zod';
import { dateStringSchema, positiveNumberSchema, taxRateSchema } from './common.schema';

// 明細行入力スキーマ
export const lineItemInputSchema = z.object({
  itemName: z.string().min(1, '品名を入力してください'),
  quantity: positiveNumberSchema,
  unit: z.string().min(1, '単位を入力してください'),
  unitPrice: z.number().nonnegative(),
  taxRate: taxRateSchema,
});

// 帳票作成スキーマ
export const documentCreateSchema = z
  .object({
    documentType: z.enum(['estimate', 'invoice']),
    clientId: z.string().min(1, '取引先を選択してください'),
    subject: z.string().min(1, '件名を入力してください').max(200),
    issueDate: dateStringSchema,
    validUntil: dateStringSchema.optional(), // 見積書のみ
    dueDate: dateStringSchema.optional(), // 請求書のみ
    notes: z.string().max(2000).optional(),
    items: z.array(lineItemInputSchema).min(1, '明細行を1行以上入力してください'),
  })
  .refine(
    (data) => {
      if (data.documentType === 'estimate') return data.validUntil !== undefined;
      return true;
    },
    { message: '有効期限を入力してください', path: ['validUntil'] },
  )
  .refine(
    (data) => {
      if (data.documentType === 'invoice') return data.dueDate !== undefined;
      return true;
    },
    { message: '支払期限を入力してください', path: ['dueDate'] },
  );

// 帳票更新スキーマ
export const documentUpdateSchema = z.object({
  documentId: z.string().min(1),
  clientId: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  subject: z.string().min(1).max(200).optional(),
  issueDate: dateStringSchema.optional(),
  validUntil: dateStringSchema.optional(),
  dueDate: dateStringSchema.optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(lineItemInputSchema).min(1).optional(),
});

// 帳票一覧フィルタスキーマ
export const documentListFiltersSchema = z.object({
  documentType: z.enum(['estimate', 'invoice']).optional(),
  status: z
    .array(
      z.enum([
        'draft',
        'pending_approval',
        'confirmed',
        'sent',
        'paid',
        'overdue',
        'won',
        'lost',
        'cancelled',
      ]),
    )
    .optional(),
  clientName: z.string().optional(),
  documentNumber: z.string().optional(),
  issueDateFrom: dateStringSchema.optional(),
  issueDateTo: dateStringSchema.optional(),
  amountMin: z.number().nonnegative().optional(),
  amountMax: z.number().nonnegative().optional(),
  createdBy: z.string().optional(),
  limit: z.number().int().min(10).max(50).optional().default(20),
  cursor: z.string().optional(),
});

// 帳票取消スキーマ
export const documentCancelSchema = z.object({
  documentId: z.string().min(1),
  reason: z.string().min(1, '取消理由を入力してください').max(500),
});

// 見積書→請求書変換スキーマ
export const convertToInvoiceSchema = z.object({
  estimateId: z.string().min(1),
  dueDate: dateStringSchema,
});
