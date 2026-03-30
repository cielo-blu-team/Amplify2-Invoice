'use server';

import { z } from 'zod';
import * as expenseService from '@/services/expense.service';
import { expenseCreateSchema, expenseRuleCreateSchema, expenseImportRowSchema } from '@/schemas/expense.schema';
import type { ApiResponse, Expense, ExpenseRule, ProfitLossSummary } from '@/types';

export async function createExpense(input: unknown): Promise<ApiResponse<Expense>> {
  try {
    const parsed = expenseCreateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '入力値が不正です', details: parsed.error.flatten().fieldErrors as Record<string, unknown> },
      };
    }
    const expense = await expenseService.createExpense(parsed.data);
    return { success: true, data: expense };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}

export async function updateExpense(expenseId: string, input: unknown): Promise<ApiResponse<void>> {
  try {
    const parsed = expenseCreateSchema.partial().safeParse(input);
    if (!parsed.success) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: '入力値が不正です' } };
    }
    await expenseService.updateExpense(expenseId, parsed.data);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}

export async function deleteExpense(expenseId: string): Promise<ApiResponse<void>> {
  try {
    await expenseService.deleteExpense(expenseId);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}

export async function listExpenses(filters: {
  month?: string;
  category?: string;
  keyword?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<ApiResponse<{ items: Expense[]; cursor?: string }>> {
  try {
    const result = await expenseService.listExpenses(filters);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}

export async function importExpenses(jsonText: string): Promise<ApiResponse<{ created: number; skipped: number }>> {
  try {
    let rows: unknown[];
    try {
      const parsed = JSON.parse(jsonText);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'JSONの形式が正しくありません' } };
    }

    const validRows = [];
    for (const row of rows) {
      const parsed = expenseImportRowSchema.safeParse(row);
      if (parsed.success) validRows.push(parsed.data);
    }

    if (validRows.length === 0) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: '有効な経費データが見つかりませんでした' } };
    }

    const rules = await expenseService.listRules();
    const result = await expenseService.createExpenseBatch(
      validRows.map((r) => ({
        date: r.date,
        vendor: r.vendor,
        description: r.description ?? '',
        amount: typeof r.amount === 'number' ? r.amount : 0,
        category: r.category ?? 'other',
        paymentMethod: r.paymentMethod ?? 'other',
      })),
      rules,
    );
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}

export async function listRules(): Promise<ApiResponse<ExpenseRule[]>> {
  try {
    const rules = await expenseService.listRules();
    return { success: true, data: rules };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}

export async function createRule(input: unknown): Promise<ApiResponse<ExpenseRule>> {
  try {
    const parsed = expenseRuleCreateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: '入力値が不正です', details: parsed.error.flatten().fieldErrors as Record<string, unknown> } };
    }
    const rule = await expenseService.createRule(parsed.data);
    return { success: true, data: rule };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}

const ruleUpdateSchema = expenseRuleCreateSchema.partial().merge(
  z.object({ isEnabled: z.boolean().optional() }),
);

export async function updateRule(ruleId: string, input: unknown): Promise<ApiResponse<void>> {
  try {
    const parsed = ruleUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: '入力値が不正です' } };
    }
    await expenseService.updateRule(ruleId, parsed.data);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}

export async function deleteRule(ruleId: string): Promise<ApiResponse<void>> {
  try {
    await expenseService.deleteRule(ruleId);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}

export async function getProfitLoss(months?: number): Promise<ApiResponse<ProfitLossSummary>> {
  try {
    const data = await expenseService.getProfitLoss(months);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : '予期しないエラーが発生しました' } };
  }
}
