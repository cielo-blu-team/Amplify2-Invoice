// Server-side data fetching（Server Component から呼ぶ）

import * as expenseService from '@/services/expense.service';
import type { Expense, ProfitLossSummary } from '@/types';

export async function getExpenses(filters: {
  status?: string;
  category?: string;
  month?: string;
  keyword?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: Expense[]; cursor?: string }> {
  return expenseService.listExpenses(filters);
}

export async function getProfitLoss(months?: number): Promise<ProfitLossSummary> {
  return expenseService.getProfitLoss(months);
}
