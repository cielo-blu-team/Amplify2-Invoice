import type { Expense, ExpenseRule } from '@/types';
import {
  getFirestoreClient,
  applyCursorToQuery,
  generateNextCursor,
  stripLegacyFields,
  withUpdatedAt,
} from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

// ─── Expense ────────────────────────────────────────────────────────────────

export async function getExpenseById(expenseId: string): Promise<Expense | null> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.EXPENSES).doc(expenseId).get();
  if (!snap.exists) return null;
  return { ...snap.data(), expenseId: snap.id } as Expense;
}

export async function createExpense(data: Expense): Promise<void> {
  const db = getFirestoreClient();
  const docRef = db.collection(COLLECTIONS.EXPENSES).doc(data.expenseId);
  await db.runTransaction(async (tx) => {
    if ((await tx.get(docRef)).exists) throw new Error(`Expense ${data.expenseId} already exists`);
    tx.set(docRef, stripLegacyFields(data, 'expenseId'));
  });
}

export async function updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.EXPENSES)
    .doc(expenseId)
    .update(withUpdatedAt(stripLegacyFields(updates, 'expenseId')));
}

export async function softDeleteExpense(expenseId: string): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.EXPENSES)
    .doc(expenseId)
    .update(withUpdatedAt({ isDeleted: true }));
}

export interface ExpenseListFilters {
  month?: string;    // YYYY-MM
  category?: string;
  keyword?: string;
  status?: string;   // 'pending' | 'confirmed'
  limit?: number;
  cursor?: string;
}

export async function listExpenses(
  filters: ExpenseListFilters = {},
): Promise<{ items: Expense[]; cursor?: string }> {
  const pageSize = filters.limit ?? 50;

  let query = getFirestoreClient()
    .collection(COLLECTIONS.EXPENSES)
    .where('isDeleted', '==', false)
    .orderBy('date', 'desc') as FirebaseFirestore.Query;

  if (filters.status) query = query.where('status', '==', filters.status);
  if (filters.category) query = query.where('category', '==', filters.category);
  if (filters.month) {
    const start = `${filters.month}-01`;
    const end = `${filters.month}-31`;
    query = query.where('date', '>=', start).where('date', '<=', end);
  }

  query = await applyCursorToQuery(query, COLLECTIONS.EXPENSES, filters.cursor);
  const snap = await query.limit(pageSize).get();

  let items = snap.docs.map((d) => ({ ...d.data(), expenseId: d.id }) as Expense);

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    items = items.filter(
      (e) => e.vendor.toLowerCase().includes(kw) || e.description.toLowerCase().includes(kw),
    );
  }

  return { items, cursor: generateNextCursor(snap.docs, pageSize) };
}

export async function approveExpenses(
  expenseIds: string[],
  confirmedBy: string,
): Promise<void> {
  const db = getFirestoreClient();
  const now = new Date().toISOString();
  const batch = db.batch();
  for (const id of expenseIds) {
    batch.update(db.collection(COLLECTIONS.EXPENSES).doc(id), {
      status: 'confirmed',
      confirmedAt: now,
      confirmedBy,
      updatedAt: now,
    });
  }
  await batch.commit();
}

export async function listExpensesByDateRange(
  startDate: string,
  endDate: string,
  status?: string,
): Promise<Expense[]> {
  let query = getFirestoreClient()
    .collection(COLLECTIONS.EXPENSES)
    .where('isDeleted', '==', false)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate) as FirebaseFirestore.Query;
  if (status) query = query.where('status', '==', status);
  const snap = await query.orderBy('date', 'desc').get();
  return snap.docs.map((d) => ({ ...d.data(), expenseId: d.id }) as Expense);
}

// ─── ExpenseRule ─────────────────────────────────────────────────────────────

export async function listExpenseRules(): Promise<ExpenseRule[]> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.EXPENSE_RULES)
    .orderBy('priority', 'asc')
    .get();
  return snap.docs.map((d) => ({ ...d.data(), ruleId: d.id }) as ExpenseRule);
}

export async function getExpenseRuleById(ruleId: string): Promise<ExpenseRule | null> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.EXPENSE_RULES).doc(ruleId).get();
  if (!snap.exists) return null;
  return { ...snap.data(), ruleId: snap.id } as ExpenseRule;
}

export async function createExpenseRule(data: ExpenseRule): Promise<void> {
  const db = getFirestoreClient();
  const docRef = db.collection(COLLECTIONS.EXPENSE_RULES).doc(data.ruleId);
  await db.runTransaction(async (tx) => {
    if ((await tx.get(docRef)).exists) throw new Error(`Rule ${data.ruleId} already exists`);
    tx.set(docRef, stripLegacyFields(data, 'ruleId'));
  });
}

export async function updateExpenseRule(ruleId: string, updates: Partial<ExpenseRule>): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.EXPENSE_RULES)
    .doc(ruleId)
    .update(withUpdatedAt(stripLegacyFields(updates, 'ruleId')));
}

export async function deleteExpenseRule(ruleId: string): Promise<void> {
  await getFirestoreClient().collection(COLLECTIONS.EXPENSE_RULES).doc(ruleId).delete();
}
