'use client';

import { useState, useTransition } from 'react';
import {
  Plus, Upload, Trash2, Pencil, ToggleLeft, ToggleRight,
  TrendingUp, TrendingDown, DollarSign, Percent,
  CheckCircle2, CheckSquare, Square,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/lib/toast';
import { hasPermission } from '@/lib/auth';
import type { Role } from '@/types/user';
import type {
  Expense, ExpenseRule, ProfitLossSummary,
  ExpenseCategory, PaymentMethod, RuleCondition,
} from '@/types';
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '@/types';
import {
  createExpense, updateExpense, deleteExpense, listExpenses,
  importExpenses, approveExpenses,
  createRule, updateRule, deleteRule,
} from '@/actions/expense';

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];
const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  transportation: 'bg-blue-50 text-blue-700',
  communication: 'bg-purple-50 text-purple-700',
  entertainment: 'bg-pink-50 text-pink-700',
  consumables: 'bg-amber-50 text-amber-700',
  outsourcing: 'bg-indigo-50 text-indigo-700',
  advertising: 'bg-orange-50 text-orange-700',
  rent: 'bg-cyan-50 text-cyan-700',
  insurance: 'bg-teal-50 text-teal-700',
  tax: 'bg-red-50 text-red-700',
  utilities: 'bg-lime-50 text-lime-700',
  equipment: 'bg-zinc-100 text-zinc-700',
  other: 'bg-zinc-50 text-zinc-500',
};

function fmt(n: number) { return '¥' + n.toLocaleString('ja-JP'); }

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  role: Role;
  initialPending: Expense[];
  initialConfirmed: Expense[];
  initialRules: ExpenseRule[];
  initialPL: ProfitLossSummary | null;
}

// ─── 経費フォーム初期値 ───────────────────────────────────────────────────────

const emptyExpense = () => ({
  date: new Date().toISOString().slice(0, 10),
  vendor: '',
  description: '',
  amount: '',
  category: 'other' as ExpenseCategory,
  paymentMethod: 'credit_card' as PaymentMethod,
});

// ─── ルールフォーム型 ─────────────────────────────────────────────────────────

type RuleFormState = {
  name: string;
  conditionLogic: 'AND' | 'OR';
  category: ExpenseCategory;
  priority: string;
  conditions: RuleCondition[];
};

const emptyRule = (): RuleFormState => ({
  name: '',
  conditionLogic: 'AND',
  category: 'other',
  priority: '100',
  conditions: [{ field: 'vendor', operator: 'contains', value: '' }],
});

// ─── 経費行コンポーネント ─────────────────────────────────────────────────────

function ExpenseRow({
  expense,
  selectable,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  showApproveBtn,
  onApprove,
}: {
  expense: Expense;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showApproveBtn?: boolean;
  onApprove?: () => void;
}) {
  return (
    <TableRow className={selected ? 'bg-indigo-50' : undefined}>
      {selectable && (
        <TableCell className="w-8">
          <button onClick={onToggleSelect} className="text-zinc-400 hover:text-indigo-600">
            {selected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
          </button>
        </TableCell>
      )}
      <TableCell className="text-sm">{expense.date}</TableCell>
      <TableCell className="text-sm font-medium">{expense.vendor}</TableCell>
      <TableCell className="text-sm text-zinc-500 max-w-[180px] truncate">{expense.description}</TableCell>
      <TableCell className="text-sm text-right font-mono">{fmt(expense.amount)}</TableCell>
      <TableCell>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLORS[expense.category])}>
          {EXPENSE_CATEGORY_LABELS[expense.category]}
        </span>
        {expense.isAutoClassified && (
          <span className="ml-1 text-[10px] text-indigo-400">自動</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-zinc-400">{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</TableCell>
      <TableCell className="text-xs text-zinc-400">{expense.source === 'import' ? '取込' : '手動'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {showApproveBtn && (
            <Button
              variant="ghost" size="sm"
              className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={onApprove}
              title="承認"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              承認
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700" onClick={onEdit} title="編集">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={onDelete} title="削除">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ExpenseClient({ role, initialPending, initialConfirmed, initialRules, initialPL }: Props) {
  const canReadExpense  = hasPermission(role, 'expense:read');
  const canWriteExpense = hasPermission(role, 'expense:write');
  const canImport       = hasPermission(role, 'expense:import');
  const canManageRules  = hasPermission(role, 'expense:rule');
  const canReadPL       = hasPermission(role, 'pl:read');

  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>(initialPending);
  const [confirmedExpenses, setConfirmedExpenses] = useState<Expense[]>(initialConfirmed);
  const [rules, setRules] = useState<ExpenseRule[]>(initialRules);
  const [pl] = useState<ProfitLossSummary | null>(initialPL);
  const [isPending, startTransition] = useTransition();

  // 未仕訳選択
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // フィルタ（確定済み）
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterKeyword, setFilterKeyword] = useState('');

  // 経費ダイアログ
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState(emptyExpense());

  // インポートダイアログ
  const [importDialog, setImportDialog] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  // ルールダイアログ
  const [ruleDialog, setRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ExpenseRule | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormState>(emptyRule());

  // ─── 承認処理 ─────────────────────────────────────────────────────────────

  const handleApprove = async (ids: string[]) => {
    if (ids.length === 0) return;
    const res = await approveExpenses(ids);
    if (!res.success) { showError(res.error?.message ?? '承認に失敗しました'); return; }

    const approvedSet = new Set(ids);
    const approved = pendingExpenses.filter((e) => approvedSet.has(e.expenseId));
    setPendingExpenses((prev) => prev.filter((e) => !approvedSet.has(e.expenseId)));
    setConfirmedExpenses((prev) => [
      ...approved.map((e) => ({ ...e, status: 'confirmed' as const })),
      ...prev,
    ]);
    setSelectedIds(new Set());
    showSuccess(`${ids.length}件を確定しました`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingExpenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingExpenses.map((e) => e.expenseId)));
    }
  };

  // ─── 確定済みフィルタ ─────────────────────────────────────────────────────

  const filteredConfirmed = confirmedExpenses.filter((e) => {
    if (filterMonth && !e.date.startsWith(filterMonth)) return false;
    if (filterCategory && filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterKeyword) {
      const kw = filterKeyword.toLowerCase();
      if (!e.vendor.toLowerCase().includes(kw) && !e.description.toLowerCase().includes(kw)) return false;
    }
    return true;
  });

  const handleSearchConfirmed = () => {
    startTransition(async () => {
      const res = await listExpenses({
        status: 'confirmed',
        month: filterMonth || undefined,
        category: (filterCategory && filterCategory !== 'all') ? filterCategory : undefined,
        keyword: filterKeyword || undefined,
      });
      if (res.success && res.data) setConfirmedExpenses(res.data.items);
    });
  };

  // ─── 経費追加・編集 ───────────────────────────────────────────────────────

  const openNewExpense = () => {
    setEditingExpense(null);
    setExpenseForm(emptyExpense());
    setExpenseDialog(true);
  };

  const openEditExpense = (e: Expense) => {
    setEditingExpense(e);
    setExpenseForm({ date: e.date, vendor: e.vendor, description: e.description, amount: String(e.amount), category: e.category, paymentMethod: e.paymentMethod });
    setExpenseDialog(true);
  };

  const handleSaveExpense = async () => {
    const data = {
      date: expenseForm.date,
      vendor: expenseForm.vendor,
      description: expenseForm.description,
      amount: parseInt(expenseForm.amount, 10) || 0,
      category: expenseForm.category,
      paymentMethod: expenseForm.paymentMethod,
    };

    if (editingExpense) {
      const res = await updateExpense(editingExpense.expenseId, data);
      if (!res.success) { showError(res.error?.message ?? '更新に失敗しました'); return; }
      // pending / confirmed どちらも更新
      const updater = (prev: Expense[]) => prev.map((e) => e.expenseId === editingExpense.expenseId ? { ...e, ...data } : e);
      setPendingExpenses(updater);
      setConfirmedExpenses(updater);
      showSuccess('経費を更新しました');
    } else {
      const res = await createExpense(data);
      if (!res.success) { showError(res.error?.message ?? '登録に失敗しました'); return; }
      if (res.data) setPendingExpenses((prev) => [res.data!, ...prev]);
      showSuccess('経費を仮登録しました（未仕訳一覧に追加されました）');
    }
    setExpenseDialog(false);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!confirm('この経費を削除しますか？')) return;
    const res = await deleteExpense(expense.expenseId);
    if (!res.success) { showError(res.error?.message ?? '削除に失敗しました'); return; }
    setPendingExpenses((prev) => prev.filter((e) => e.expenseId !== expense.expenseId));
    setConfirmedExpenses((prev) => prev.filter((e) => e.expenseId !== expense.expenseId));
    showSuccess('経費を削除しました');
  };

  // ─── インポート ───────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!importJson.trim()) { showError('JSONを入力してください'); return; }
    setImportLoading(true);
    try {
      const res = await importExpenses(importJson);
      if (!res.success) { showError(res.error?.message ?? '取込に失敗しました'); return; }
      showSuccess(`${res.data!.created}件を仮登録しました（スキップ: ${res.data!.skipped}件）`);
      setImportDialog(false);
      setImportJson('');
      const listRes = await listExpenses({ status: 'pending' });
      if (listRes.success && listRes.data) setPendingExpenses(listRes.data.items);
    } finally {
      setImportLoading(false);
    }
  };

  // ─── ルール ────────────────────────────────────────────────────────────────

  const openNewRule = () => { setEditingRule(null); setRuleForm(emptyRule()); setRuleDialog(true); };
  const openEditRule = (r: ExpenseRule) => {
    setEditingRule(r);
    setRuleForm({ name: r.name, conditionLogic: r.conditionLogic, category: r.category, priority: String(r.priority), conditions: r.conditions });
    setRuleDialog(true);
  };
  const handleSaveRule = async () => {
    const data = { name: ruleForm.name, conditionLogic: ruleForm.conditionLogic, category: ruleForm.category, priority: parseInt(ruleForm.priority, 10) || 100, conditions: ruleForm.conditions };
    if (editingRule) {
      const res = await updateRule(editingRule.ruleId, data);
      if (!res.success) { showError(res.error?.message ?? '更新に失敗しました'); return; }
      setRules((prev) => prev.map((r) => r.ruleId === editingRule.ruleId ? { ...r, ...data } : r));
      showSuccess('ルールを更新しました');
    } else {
      const res = await createRule(data);
      if (!res.success) { showError(res.error?.message ?? '登録に失敗しました'); return; }
      if (res.data) setRules((prev) => [...prev, res.data!].sort((a, b) => a.priority - b.priority));
      showSuccess('ルールを登録しました');
    }
    setRuleDialog(false);
  };
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('このルールを削除しますか？')) return;
    const res = await deleteRule(ruleId);
    if (!res.success) { showError(res.error?.message ?? '削除に失敗しました'); return; }
    setRules((prev) => prev.filter((r) => r.ruleId !== ruleId));
    showSuccess('ルールを削除しました');
  };
  const handleToggleRule = async (r: ExpenseRule) => {
    const res = await updateRule(r.ruleId, { isEnabled: !r.isEnabled });
    if (!res.success) { showError(res.error?.message ?? '更新に失敗しました'); return; }
    setRules((prev) => prev.map((x) => x.ruleId === r.ruleId ? { ...x, isEnabled: !x.isEnabled } : x));
  };
  const setCondition = (i: number, key: keyof RuleCondition, val: string) =>
    setRuleForm((prev) => ({ ...prev, conditions: prev.conditions.map((c, idx) => idx === i ? { ...c, [key]: val } : c) }));
  const addCondition = () =>
    setRuleForm((prev) => ({ ...prev, conditions: [...prev.conditions, { field: 'vendor', operator: 'contains', value: '' }] }));
  const removeCondition = (i: number) =>
    setRuleForm((prev) => ({ ...prev, conditions: prev.conditions.filter((_, idx) => idx !== i) }));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-zinc-900">経費管理</h2>

      {!canReadExpense && (
        <Card>
          <CardContent className="py-16 text-center text-zinc-400 text-sm">
            経費管理を閲覧する権限がありません。管理者にお問い合わせください。
          </CardContent>
        </Card>
      )}

      {canReadExpense && (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              未仕訳一覧
              {pendingExpenses.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                  {pendingExpenses.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">確定済み</TabsTrigger>
            {canManageRules && <TabsTrigger value="rules">分類ルール</TabsTrigger>}
            {canReadPL && <TabsTrigger value="pl">収支管理</TabsTrigger>}
          </TabsList>

          {/* ── Tab 1: 未仕訳一覧 ──────────────────────────────────────────── */}
          <TabsContent value="pending" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-zinc-500">
                  {pendingExpenses.length}件の未仕訳経費があります。承認すると確定済みに移動します。
                </p>
              </div>
              <div className="flex gap-2">
                {canImport && (
                  <Button variant="outline" size="sm" onClick={() => setImportDialog(true)}>
                    <Upload className="h-4 w-4 mr-1" />
                    マネーフォワード取込
                  </Button>
                )}
                {canWriteExpense && (
                  <Button size="sm" onClick={openNewExpense}>
                    <Plus className="h-4 w-4 mr-1" />
                    手動追加
                  </Button>
                )}
              </div>
            </div>

            {/* 一括操作バー */}
            {canWriteExpense && pendingExpenses.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-indigo-600 flex items-center gap-1.5 text-sm">
                  {selectedIds.size === pendingExpenses.length && pendingExpenses.length > 0
                    ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                    : <Square className="h-4 w-4" />
                  }
                  全選択
                </button>
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-sm text-zinc-500">{selectedIds.size}件選択中</span>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(Array.from(selectedIds))}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      選択した{selectedIds.size}件を承認・確定
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canWriteExpense && <TableHead className="w-8" />}
                    <TableHead>日付</TableHead>
                    <TableHead>支払先</TableHead>
                    <TableHead>摘要</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>支払方法</TableHead>
                    <TableHead>取得元</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingExpenses.length > 0 ? pendingExpenses.map((e) => (
                    <ExpenseRow
                      key={e.expenseId}
                      expense={e}
                      selectable={canWriteExpense}
                      selected={selectedIds.has(e.expenseId)}
                      onToggleSelect={() => toggleSelect(e.expenseId)}
                      onEdit={canWriteExpense ? () => openEditExpense(e) : undefined}
                      onDelete={canWriteExpense ? () => handleDeleteExpense(e) : undefined}
                      showApproveBtn={canWriteExpense}
                      onApprove={() => handleApprove([e.expenseId])}
                    />
                  )) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-zinc-400 text-sm">
                        未仕訳の経費はありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {pendingExpenses.length > 0 && (
              <div className="flex justify-end text-sm text-zinc-500">
                合計: <span className="font-semibold ml-2">{fmt(pendingExpenses.reduce((s, e) => s + e.amount, 0))}</span>
              </div>
            )}
          </TabsContent>

          {/* ── Tab 2: 確定済み ────────────────────────────────────────────── */}
          <TabsContent value="confirmed" className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">月</Label>
                <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-36 h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">カテゴリ</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="すべて" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">検索</Label>
                <Input value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} placeholder="支払先・摘要..." className="w-44 h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleSearchConfirmed()} />
              </div>
              <Button variant="outline" size="sm" onClick={handleSearchConfirmed} disabled={isPending}>検索</Button>
            </div>

            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>{filteredConfirmed.length}件 | </span>
              <span className="font-semibold ml-1">{fmt(filteredConfirmed.reduce((s, e) => s + e.amount, 0))}</span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>支払先</TableHead>
                    <TableHead>摘要</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>支払方法</TableHead>
                    <TableHead>取得元</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfirmed.length > 0 ? filteredConfirmed.map((e) => (
                    <ExpenseRow
                      key={e.expenseId}
                      expense={e}
                      onEdit={canWriteExpense ? () => openEditExpense(e) : undefined}
                      onDelete={canWriteExpense ? () => handleDeleteExpense(e) : undefined}
                    />
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-zinc-400 text-sm">
                        確定済みの経費データがありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Tab 3: 分類ルール ──────────────────────────────────────────── */}
          {canManageRules && (
            <TabsContent value="rules" className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={openNewRule}><Plus className="h-4 w-4 mr-1" />ルール追加</Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>優先度</TableHead>
                      <TableHead>ルール名</TableHead>
                      <TableHead>条件</TableHead>
                      <TableHead>分類カテゴリ</TableHead>
                      <TableHead>有効</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.length > 0 ? rules.map((r) => (
                      <TableRow key={r.ruleId}>
                        <TableCell className="text-sm font-mono">{r.priority}</TableCell>
                        <TableCell className="text-sm font-medium">{r.name}</TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {r.conditions.map((c, i) => (
                            <span key={i}>{i > 0 && <span className="text-indigo-500 font-bold mx-1">{r.conditionLogic}</span>}{c.field}:{c.operator}:{c.value}</span>
                          ))}
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLORS[r.category])}>
                            {EXPENSE_CATEGORY_LABELS[r.category]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch checked={r.isEnabled} onCheckedChange={() => handleToggleRule(r)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600" onClick={() => openEditRule(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeleteRule(r.ruleId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-zinc-400 text-sm">分類ルールがありません</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* ── Tab 4: 収支管理 ────────────────────────────────────────────── */}
          {canReadPL && (
            <TabsContent value="pl" className="space-y-4">
              {pl ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: '総売上', value: fmt(pl.totalRevenue), icon: TrendingUp, color: 'text-green-600' },
                      { label: '総経費（確定）', value: fmt(pl.totalExpenses), icon: TrendingDown, color: 'text-red-500' },
                      { label: '純利益', value: fmt(pl.totalProfit), icon: DollarSign, color: pl.totalProfit >= 0 ? 'text-green-600' : 'text-red-500' },
                      { label: '利益率', value: `${pl.profitMargin}%`, icon: Percent, color: 'text-indigo-600' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <Card key={label}>
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-500">{label}</span>
                            <Icon className={cn('h-4 w-4', color)} />
                          </div>
                          <p className={cn('text-lg font-bold', color)}>{value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">月別収支（確定済み経費のみ）</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>月</TableHead>
                            <TableHead className="text-right">売上</TableHead>
                            <TableHead className="text-right">経費</TableHead>
                            <TableHead className="text-right">利益</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pl.monthly.map((m) => (
                            <TableRow key={m.month}>
                              <TableCell className="font-medium">{m.month}</TableCell>
                              <TableCell className="text-right text-green-600">{fmt(m.revenue)}</TableCell>
                              <TableCell className="text-right text-red-500">{fmt(m.expenses)}</TableCell>
                              <TableCell className={cn('text-right font-semibold', m.profit >= 0 ? 'text-green-600' : 'text-red-500')}>{fmt(m.profit)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-zinc-400 text-sm">収支データを取得できませんでした</CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* ── 経費追加・編集ダイアログ ─────────────────────────────────────── */}
      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? '経費を編集' : '経費を手動追加（仮登録）'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { label: '日付', type: 'date', key: 'date' },
              { label: '支払先', placeholder: '例: Amazon', key: 'vendor' },
              { label: '摘要', placeholder: '例: 文房具購入', key: 'description' },
              { label: '金額（円）', type: 'number', placeholder: '例: 3000', key: 'amount' },
            ].map(({ label, type, placeholder, key }) => (
              <div key={key} className="space-y-1">
                <Label className="text-sm">{label}</Label>
                <Input type={type ?? 'text'} placeholder={placeholder} value={(expenseForm as Record<string, string>)[key]} onChange={(e) => setExpenseForm((prev) => ({ ...prev, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-sm">カテゴリ</Label>
              <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm((prev) => ({ ...prev, category: v as ExpenseCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">支払方法</Label>
              <Select value={expenseForm.paymentMethod} onValueChange={(v) => setExpenseForm((prev) => ({ ...prev, paymentMethod: v as PaymentMethod }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog(false)}>キャンセル</Button>
            <Button onClick={handleSaveExpense}>{editingExpense ? '更新' : '仮登録'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── インポートダイアログ ────────────────────────────────────────────── */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>マネーフォワード 取込（仮登録）</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">マネーフォワードからエクスポートしたJSONを貼り付けてください。取込後は未仕訳一覧に追加されます。</p>
            <Textarea value={importJson} onChange={(e) => setImportJson(e.target.value)} rows={10} placeholder='[{"date":"2024-01-15","vendor":"Amazon","description":"文房具","amount":3000,"paymentMethod":"credit_card"}]' className="font-mono text-xs" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)}>キャンセル</Button>
            <Button onClick={handleImport} disabled={importLoading}>{importLoading ? '取込中...' : '取込（仮登録）'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ルール編集ダイアログ ─────────────────────────────────────────────── */}
      {canManageRules && (
        <Dialog open={ruleDialog} onOpenChange={setRuleDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'ルールを編集' : 'ルールを追加'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">ルール名</Label>
                  <Input value={ruleForm.name} onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">優先度（小さいほど優先）</Label>
                  <Input type="number" value={ruleForm.priority} onChange={(e) => setRuleForm((p) => ({ ...p, priority: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">条件ロジック</Label>
                  <Select value={ruleForm.conditionLogic} onValueChange={(v) => setRuleForm((p) => ({ ...p, conditionLogic: v as 'AND' | 'OR' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND（すべて一致）</SelectItem>
                      <SelectItem value="OR">OR（いずれか一致）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">分類カテゴリ</Label>
                  <Select value={ruleForm.category} onValueChange={(v) => setRuleForm((p) => ({ ...p, category: v as ExpenseCategory }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">条件</Label>
                {ruleForm.conditions.map((cond, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={cond.field} onValueChange={(v) => setCondition(i, 'field', v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vendor">支払先</SelectItem>
                        <SelectItem value="description">摘要</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={cond.operator} onValueChange={(v) => setCondition(i, 'operator', v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">を含む</SelectItem>
                        <SelectItem value="equals">と一致</SelectItem>
                        <SelectItem value="starts_with">で始まる</SelectItem>
                        <SelectItem value="ends_with">で終わる</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="flex-1" value={cond.value} onChange={(e) => setCondition(i, 'value', e.target.value)} placeholder="キーワード" />
                    {ruleForm.conditions.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => removeCondition(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addCondition}><Plus className="h-3.5 w-3.5 mr-1" />条件を追加</Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRuleDialog(false)}>キャンセル</Button>
              <Button onClick={handleSaveRule}>{editingRule ? '更新' : '追加'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
