'use server';

import type { ApiResponse, ExpenseCategory } from '@/types';
import * as expenseService from '@/services/expense.service';
import { saveClassificationCorrection } from '@/services/ai-classifier.service';
import * as expenseRepo from '@/repositories/expense.repository';
import { getCurrentUserId } from '@/lib/auth-server';

/**
 * AI分類を修正して経費を確定する
 * 修正履歴を保存し、今後のAI分類の精度向上に活用する
 */
export async function correctAndApproveExpense(
  expenseId: string,
  correctedCategory: ExpenseCategory,
  correctedAccountItem: string,
): Promise<ApiResponse<void>> {
  try {
    const userId = await getCurrentUserId();

    // 現在の経費データを取得
    const expense = await expenseRepo.getExpenseById(expenseId);
    if (!expense) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: '経費が見つかりません' },
      };
    }

    // AI分類との差分がある場合、修正履歴を保存（学習用）
    const aiCategory = expense.aiSuggestedCategory ?? expense.category;
    if (aiCategory !== correctedCategory || expense.aiSuggestedAccountItem !== correctedAccountItem) {
      await saveClassificationCorrection({
        mfJournalId: expense.mfJournalId,
        vendor: expense.vendor,
        description: expense.description,
        amount: expense.amount,
        aiCategory,
        aiConfidence: expense.aiConfidence ?? 0,
        aiAccountItem: expense.aiSuggestedAccountItem,
        finalCategory: correctedCategory,
        finalAccountItem: correctedAccountItem || undefined,
        correctedBy: userId,
        correctedAt: new Date().toISOString(),
      });
    }

    // 経費を更新して確定
    await expenseRepo.updateExpense(expenseId, {
      category: correctedCategory,
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      confirmedBy: userId,
    });

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : '予期しないエラーが発生しました',
      },
    };
  }
}
