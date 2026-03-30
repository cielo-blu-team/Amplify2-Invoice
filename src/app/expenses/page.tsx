export const dynamic = 'force-dynamic';

import * as expenseService from '@/services/expense.service';
import { getCurrentUserRole } from '@/lib/auth-server';
import { hasPermission } from '@/lib/auth';
import ExpenseClient from './ExpenseClient';

export default async function ExpensePage() {
  const role = await getCurrentUserRole();

  const canReadExpense = hasPermission(role, 'expense:read');

  const [expenseResult, rules, pl] = await Promise.all([
    canReadExpense
      ? expenseService.listExpenses({ limit: 50 }).catch(() => ({ items: [], cursor: undefined }))
      : Promise.resolve({ items: [], cursor: undefined }),
    hasPermission(role, 'expense:rule')
      ? expenseService.listRules().catch(() => [])
      : Promise.resolve([]),
    hasPermission(role, 'pl:read')
      ? expenseService.getProfitLoss(6).catch(() => null)
      : Promise.resolve(null),
  ]);

  return (
    <ExpenseClient
      role={role}
      initialExpenses={expenseResult.items}
      initialRules={rules}
      initialPL={pl}
    />
  );
}
