import { randomUUID } from 'crypto';
import type {
  Expense, ExpenseCreateInput, ExpenseRule, ExpenseRuleCreateInput,
  ExpenseCategory, ProfitLossSummary,
} from '@/types';
import * as repo from '@/repositories/expense.repository';
import { getFirestoreClient } from '@/repositories/_firestore-client';
import { COLLECTIONS } from '@/lib/constants';
import type { DocumentHeader } from '@/types';

// ─── Rule Engine ─────────────────────────────────────────────────────────────

function matchesRule(
  expense: { vendor: string; description: string },
  rule: ExpenseRule,
): boolean {
  const results = rule.conditions.map((cond) => {
    const target = cond.field === 'vendor' ? expense.vendor : expense.description;
    const val = cond.value.toLowerCase();
    const src = target.toLowerCase();
    switch (cond.operator) {
      case 'contains':    return src.includes(val);
      case 'equals':      return src === val;
      case 'starts_with': return src.startsWith(val);
      case 'ends_with':   return src.endsWith(val);
    }
  });
  return rule.conditionLogic === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

export function classifyByRules(
  expense: { vendor: string; description: string },
  rules: ExpenseRule[],
): { category: ExpenseCategory; isAutoClassified: boolean } {
  const active = [...rules].filter((r) => r.isEnabled).sort((a, b) => a.priority - b.priority);
  for (const rule of active) {
    if (matchesRule(expense, rule)) {
      return { category: rule.category, isAutoClassified: true };
    }
  }
  return { category: 'other', isAutoClassified: false };
}

// ─── Expense CRUD ─────────────────────────────────────────────────────────────

export async function createExpense(input: ExpenseCreateInput): Promise<Expense> {
  const now = new Date().toISOString();
  const expense: Expense = {
    expenseId: randomUUID(),
    ...input,
    isAutoClassified: input.isAutoClassified ?? false,
    source: input.source ?? 'manual',
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
  await repo.createExpense(expense);
  return expense;
}

export async function createExpenseBatch(
  rows: Omit<ExpenseCreateInput, 'isAutoClassified' | 'source'>[],
  rules: ExpenseRule[],
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const classification = classifyByRules({ vendor: row.vendor, description: row.description }, rules);
      await createExpense({
        ...row,
        category: row.category ?? classification.category,
        isAutoClassified: row.category ? false : classification.isAutoClassified,
        source: 'import',
      });
      created++;
    } catch {
      skipped++;
    }
  }

  return { created, skipped };
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<ExpenseCreateInput>,
): Promise<void> {
  await repo.updateExpense(expenseId, updates);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await repo.softDeleteExpense(expenseId);
}

export async function listExpenses(filters: repo.ExpenseListFilters = {}) {
  return repo.listExpenses(filters);
}

// ─── Rule CRUD ────────────────────────────────────────────────────────────────

export async function listRules(): Promise<ExpenseRule[]> {
  return repo.listExpenseRules();
}

export async function createRule(input: ExpenseRuleCreateInput): Promise<ExpenseRule> {
  const now = new Date().toISOString();
  const rule: ExpenseRule = {
    ruleId: randomUUID(),
    ...input,
    priority: input.priority ?? 100,
    isEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
  await repo.createExpenseRule(rule);
  return rule;
}

export async function updateRule(
  ruleId: string,
  updates: Partial<ExpenseRuleCreateInput> & { isEnabled?: boolean },
): Promise<void> {
  await repo.updateExpenseRule(ruleId, updates);
}

export async function deleteRule(ruleId: string): Promise<void> {
  await repo.deleteExpenseRule(ruleId);
}

// ─── P&L (収支管理) ───────────────────────────────────────────────────────────

export async function getProfitLoss(months: number = 6): Promise<ProfitLossSummary> {
  const now = new Date();

  // 対象月リストを生成
  const monthKeys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const startDate = `${monthKeys[0]}-01`;
  const endDate = `${monthKeys[monthKeys.length - 1]}-31`;

  // 入金済み請求書を取得
  const invoiceSnap = await getFirestoreClient()
    .collection(COLLECTIONS.DOCUMENTS)
    .where('isDeleted', '==', false)
    .where('documentType', '==', 'invoice')
    .where('status', '==', 'paid')
    .where('issueDate', '>=', startDate)
    .where('issueDate', '<=', endDate)
    .get();

  const invoices = invoiceSnap.docs.map((d) => d.data() as DocumentHeader);

  // 経費を取得
  const expenses = await repo.listExpensesByDateRange(startDate, endDate);

  // 月別集計
  const revenueByMonth = new Map<string, number>();
  const expensesByMonth = new Map<string, number>();
  for (const key of monthKeys) {
    revenueByMonth.set(key, 0);
    expensesByMonth.set(key, 0);
  }

  for (const inv of invoices) {
    const month = inv.issueDate.slice(0, 7);
    if (revenueByMonth.has(month)) {
      revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + inv.totalAmount);
    }
  }

  for (const exp of expenses) {
    const month = exp.date.slice(0, 7);
    if (expensesByMonth.has(month)) {
      expensesByMonth.set(month, (expensesByMonth.get(month) ?? 0) + exp.amount);
    }
  }

  const monthly = monthKeys.map((month) => {
    const revenue = revenueByMonth.get(month) ?? 0;
    const expTotal = expensesByMonth.get(month) ?? 0;
    return { month, revenue, expenses: expTotal, profit: revenue - expTotal };
  });

  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = monthly.reduce((s, m) => s + m.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return { monthly, totalRevenue, totalExpenses, totalProfit, profitMargin };
}
