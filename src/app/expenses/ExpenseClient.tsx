'use client';

import { useState, useTransition } from 'react';
import { Plus, Upload, Trash2, Pencil, ToggleLeft, ToggleRight, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
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
import {
  EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS,
} from '@/types';
import {
  createExpense, updateExpense, deleteExpense, listExpenses,
  importExpenses, createRule, updateRule, deleteRule,
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
  initialExpenses: Expense[];
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

// ─── ルールフォーム初期値 ─────────────────────────────────────────────────────

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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ExpenseClient({ role, initialExpenses, initialRules, initialPL }: Props) {
  const canReadExpense  = hasPermission(role, 'expense:read');
  const canWriteExpense = hasPermission(role, 'expense:write');
  const canImport       = hasPermission(role, 'expense:import');
  const canManageRules  = hasPermission(role, 'expense:rule');
  const canReadPL       = hasPermission(role, 'pl:read');
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [rules, setRules] = useState<ExpenseRule[]>(initialRules);
  const [pl, setPL] = useState<ProfitLossSummary | null>(initialPL);
  const [isPending, startTransition] = useTransition();

  // フィルタ
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

  // ─── 経費一覧フィルタ ─────────────────────────────────────────────────────

  const filteredExpenses = expenses.filter((e) => {
    if (filterMonth && !e.date.startsWith(filterMonth)) return false;
    if (filterCategory && filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterKeyword) {
      const kw = filterKeyword.toLowerCase();
      if (!e.vendor.toLowerCase().includes(kw) && !e.description.toLowerCase().includes(kw)) return false;
    }
    return true;
  });

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // ─── 経費検索（サーバー） ─────────────────────────────────────────────────

  const handleSearch = () => {
    startTransition(async () => {
      const res = await listExpenses({ month: filterMonth || undefined, category: (filterCategory && filterCategory !== 'all') ? filterCategory : undefined, keyword: filterKeyword || undefined });
      if (res.success && res.data) setExpenses(res.data.items);
    });
  };

  // ─── 経費保存 ─────────────────────────────────────────────────────────────

  const openNewExpense = () => {
    setEditingExpense(null);
    setExpenseForm(emptyExpense());
    setExpenseDialog(true);
  };

  const openEditExpense = (e: Expense) => {
    setEditingExpense(e);
    setExpenseForm({
      date: e.date,
      vendor: e.vendor,
      description: e.description,
      amount: String(e.amount),
      category: e.category,
      paymentMethod: e.paymentMethod,
    });
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
      setExpenses((prev) => prev.map((e) => e.expenseId === editingExpense.expenseId ? { ...e, ...data } : e));
      showSuccess('経費を更新しました');
    } else {
      const res = await createExpense(data);
      if (!res.success) { showError(res.error?.message ?? '登録に失敗しました'); return; }
      if (res.data) setExpenses((prev) => [res.data!, ...prev]);
      showSuccess('経費を登録しました');
    }
    setExpenseDialog(false);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('この経費を削除しますか？')) return;
    const res = await deleteExpense(expenseId);
    if (!res.success) { showError(res.error?.message ?? '削除に失敗しました'); return; }
    setExpenses((prev) => prev.filter((e) => e.expenseId !== expenseId));
    showSuccess('経費を削除しました');
  };

  // ─── インポート ───────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!importJson.trim()) { showError('JSONを入力してください'); return; }
    setImportLoading(true);
    try {
      const res = await importExpenses(importJson);
      if (!res.success) { showError(res.error?.message ?? '取込に失敗しました'); return; }
      showSuccess(`${res.data!.created}件取込完了（スキップ: ${res.data!.skipped}件）`);
      setImportDialog(false);
      setImportJson('');
      // リロード
      const listRes = await listExpenses({});
      if (listRes.success && listRes.data) setExpenses(listRes.data.items);
    } finally {
      setImportLoading(false);
    }
  };

  // ─── ルール ────────────────────────────────────────────────────────────────

  const openNewRule = () => {
    setEditingRule(null);
    setRuleForm(emptyRule());
    setRuleDialog(true);
  };

  const openEditRule = (r: ExpenseRule) => {
    setEditingRule(r);
    setRuleForm({
      name: r.name,
      conditionLogic: r.conditionLogic,
      category: r.category,
      priority: String(r.priority),
      conditions: r.conditions,
    });
    setRuleDialog(true);
  };

  const handleSaveRule = async () => {
    const data = {
      name: ruleForm.name,
      conditionLogic: ruleForm.conditionLogic,
      category: ruleForm.category,
      priority: parseInt(ruleForm.priority, 10) || 100,
      conditions: ruleForm.conditions,
    };

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

  const setCondition = (index: number, key: keyof RuleCondition, value: string) => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? { ...c, [key]: value } : c),
    }));
  };

  const addCondition = () => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'vendor', operator: 'contains', value: '' }],
    }));
  };

  const removeCondition = (index: number) => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

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

      {canReadExpense && <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">経費一覧</TabsTrigger>
          {canManageRules && <TabsTrigger value="rules">分類ルール</TabsTrigger>}
          {canReadPL && <TabsTrigger value="pl">収支管理</TabsTrigger>}
        </TabsList>

        {/* ── Tab 1: 経費一覧 ────────────────────────────────────────────── */}
        <TabsContent value="expenses" className="space-y-4">
          {/* フィルタ + アクション */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-500">月</Label>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-36 h-8 text-sm"
              />
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
              <Input
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="支払先・摘要..."
                className="w-44 h-8 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>
              検索
            </Button>
            <div className="ml-auto flex gap-2">
              {canImport && (
                <Button variant="outline" size="sm" onClick={() => setImportDialog(true)}>
                  <Upload className="h-4 w-4 mr-1.5" />
                  マネーフォワード取込
                </Button>
              )}
              {canWriteExpense && (
                <Button size="sm" onClick={openNewExpense}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  手動追加
                </Button>
              )}
            </div>
          </div>

          {/* 合計 */}
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span>{filteredExpenses.length}件</span>
            <span className="text-zinc-400">|</span>
            <span className="font-semibold text-zinc-900">{fmt(filteredTotal)}</span>
          </div>

          {/* テーブル */}
          <Card>
            <CardContent className="p-0">
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
                    {canWriteExpense && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-zinc-400 py-12 text-sm">
                        経費データがありません
                      </TableCell>
                    </TableRow>
                  ) : filteredExpenses.map((e) => (
                    <TableRow key={e.expenseId}>
                      <TableCell className="text-sm text-zinc-600 whitespace-nowrap">{e.date}</TableCell>
                      <TableCell className="font-medium text-zinc-900">{e.vendor}</TableCell>
                      <TableCell className="text-sm text-zinc-600 max-w-48 truncate">{e.description}</TableCell>
                      <TableCell className="text-right font-semibold text-zinc-900">{fmt(e.amount)}</TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[e.category])}>
                          {EXPENSE_CATEGORY_LABELS[e.category]}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">{PAYMENT_METHOD_LABELS[e.paymentMethod]}</TableCell>
                      <TableCell>
                        <Badge variant={e.source === 'import' ? 'info' : 'secondary'} className="text-xs">
                          {e.source === 'import' ? '取込' : '手動'}
                          {e.isAutoClassified && ' (自動)'}
                        </Badge>
                      </TableCell>
                      {canWriteExpense && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditExpense(e)}
                              className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(e.expenseId)}
                              className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: 分類ルール ───────────────────────────────────────────── */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              優先度の低い数値のルールが優先されます。インポート時に上から順に評価し、最初にマッチしたルールのカテゴリを適用します。
            </p>
            <Button size="sm" onClick={openNewRule}>
              <Plus className="h-4 w-4 mr-1.5" />
              ルール追加
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">優先度</TableHead>
                    <TableHead>ルール名</TableHead>
                    <TableHead>条件</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead className="w-20 text-center">有効</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-zinc-400 py-12 text-sm">
                        ルールがありません
                      </TableCell>
                    </TableRow>
                  ) : rules.map((r) => (
                    <TableRow key={r.ruleId} className={!r.isEnabled ? 'opacity-50' : ''}>
                      <TableCell className="text-center font-mono text-sm text-zinc-600">{r.priority}</TableCell>
                      <TableCell className="font-medium text-zinc-900">{r.name}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {r.conditions.map((c, i) => (
                            <div key={i} className="text-xs text-zinc-500">
                              {i > 0 && <span className="text-zinc-400 mr-1">{r.conditionLogic}</span>}
                              <span className="font-medium text-zinc-700">{c.field === 'vendor' ? '支払先' : '摘要'}</span>
                              {' が '}
                              <span className="text-indigo-600">{c.value}</span>
                              {' を'}
                              {{
                                contains: '含む', equals: 'と等しい',
                                starts_with: 'で始まる', ends_with: 'で終わる',
                              }[c.operator]}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[r.category])}>
                          {EXPENSE_CATEGORY_LABELS[r.category]}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={r.isEnabled}
                          onCheckedChange={() => handleToggleRule(r)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditRule(r)}
                            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(r.ruleId)}
                            className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: 収支管理 ─────────────────────────────────────────────── */}
        <TabsContent value="pl" className="space-y-5">
          {!pl ? (
            <Card><CardContent className="py-12 text-center text-zinc-400 text-sm">データを取得できませんでした</CardContent></Card>
          ) : (
            <>
              {/* KPI カード */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: '売上合計',  value: fmt(pl.totalRevenue),  sub: '入金済み請求',  Icon: TrendingUp,   color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: '経費合計',  value: fmt(pl.totalExpenses), sub: '集計期間内',    Icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: '純利益',    value: fmt(pl.totalProfit),   sub: '売上 − 経費',  Icon: DollarSign,   color: pl.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-500', bg: pl.totalProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
                  { label: '利益率',    value: `${pl.profitMargin}%`, sub: '純利益 / 売上', Icon: Percent,      color: pl.profitMargin >= 30 ? 'text-emerald-600' : pl.profitMargin >= 10 ? 'text-amber-600' : 'text-red-500', bg: 'bg-zinc-50' },
                ].map((kpi) => (
                  <Card key={kpi.label}>
                    <CardContent className="pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{kpi.label}</span>
                        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', kpi.bg)}>
                          <kpi.Icon className={cn('h-4 w-4', kpi.color)} />
                        </div>
                      </div>
                      <p className={cn('text-2xl font-bold', kpi.color)}>{kpi.value}</p>
                      <p className="text-xs text-zinc-500 mt-1">{kpi.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 月次グラフ + テーブル */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* バーチャート */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-700">月次収支推移（過去6ヶ月）</CardTitle>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-400 inline-block" />売上</span>
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orange-400 inline-block" />経費</span>
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 inline-block" />利益</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PLBarChart data={pl.monthly} />
                  </CardContent>
                </Card>

                {/* 月次テーブル */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-700">月次明細</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>月</TableHead>
                          <TableHead className="text-right">売上</TableHead>
                          <TableHead className="text-right">経費</TableHead>
                          <TableHead className="text-right">純利益</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pl.monthly.map((m) => (
                          <TableRow key={m.month}>
                            <TableCell className="font-medium">{m.month}</TableCell>
                            <TableCell className="text-right text-sm">{fmt(m.revenue)}</TableCell>
                            <TableCell className="text-right text-sm text-orange-600">{fmt(m.expenses)}</TableCell>
                            <TableCell className={cn('text-right text-sm font-semibold', m.profit >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                              {fmt(m.profit)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>}

      {/* ─── 経費追加/編集 Dialog ─────────────────────────────────────────── */}
      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? '経費を編集' : '経費を追加'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>日付 <span className="text-red-500">*</span></Label>
                <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>金額（円）<span className="text-red-500">*</span></Label>
                <Input type="number" min={0} value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} placeholder="例: 5000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>支払先 <span className="text-red-500">*</span></Label>
              <Input value={expenseForm.vendor} onChange={(e) => setExpenseForm((p) => ({ ...p, vendor: e.target.value }))} placeholder="例: アマゾン" />
            </div>
            <div className="space-y-1.5">
              <Label>摘要 <span className="text-red-500">*</span></Label>
              <Input value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} placeholder="例: クラウドストレージ料金" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>カテゴリ</Label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm((p) => ({ ...p, category: v as ExpenseCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>支払方法</Label>
                <Select value={expenseForm.paymentMethod} onValueChange={(v) => setExpenseForm((p) => ({ ...p, paymentMethod: v as PaymentMethod }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog(false)}>キャンセル</Button>
            <Button onClick={handleSaveExpense}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── マネーフォワード取込 Dialog ─────────────────────────────────── */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>マネーフォワード取込 — 経費インポート</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-zinc-600">
              マネーフォワードから取得した経費データを JSON 形式で貼り付けてください。
              分類ルールが自動適用されます。
            </p>
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-500 font-mono leading-relaxed">
              {`[ { "date": "2026-03-01", "vendor": "AWS", "description": "クラウド費用", "amount": 12000 }, ... ]`}
            </div>
            <div className="space-y-1.5">
              <Label>JSON データ</Label>
              <Textarea
                rows={10}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[ { "date": "2026-03-01", "vendor": "支払先", "description": "摘要", "amount": 1000 } ]'
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)}>キャンセル</Button>
            <Button onClick={handleImport} disabled={importLoading}>
              {importLoading ? '取込中...' : '取込実行'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ルール追加/編集 Dialog ──────────────────────────────────────── */}
      <Dialog open={ruleDialog} onOpenChange={setRuleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'ルールを編集' : 'ルールを追加'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>ルール名 <span className="text-red-500">*</span></Label>
                <Input value={ruleForm.name} onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))} placeholder="例: AWS → 通信費" />
              </div>
              <div className="space-y-1.5">
                <Label>カテゴリ</Label>
                <Select value={ruleForm.category} onValueChange={(v) => setRuleForm((p) => ({ ...p, category: v as ExpenseCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>優先度（小さいほど優先）</Label>
                <Input type="number" min={1} max={999} value={ruleForm.priority} onChange={(e) => setRuleForm((p) => ({ ...p, priority: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>条件</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">結合:</span>
                  <Select value={ruleForm.conditionLogic} onValueChange={(v) => setRuleForm((p) => ({ ...p, conditionLogic: v as 'AND' | 'OR' }))}>
                    <SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {ruleForm.conditions.map((cond, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={cond.field} onValueChange={(v) => setCondition(i, 'field', v)}>
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">支払先</SelectItem>
                      <SelectItem value="description">摘要</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={cond.operator} onValueChange={(v) => setCondition(i, 'operator', v)}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">を含む</SelectItem>
                      <SelectItem value="equals">と等しい</SelectItem>
                      <SelectItem value="starts_with">で始まる</SelectItem>
                      <SelectItem value="ends_with">で終わる</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={cond.value}
                    onChange={(e) => setCondition(i, 'value', e.target.value)}
                    placeholder="値"
                    className="flex-1 h-8 text-sm"
                  />
                  {ruleForm.conditions.length > 1 && (
                    <button onClick={() => removeCondition(i)} className="p-1 text-zinc-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                条件を追加
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialog(false)}>キャンセル</Button>
            <Button onClick={handleSaveRule}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── P&L バーチャート ─────────────────────────────────────────────────────────

function PLBarChart({ data }: { data: { month: string; revenue: number; expenses: number; profit: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.revenue, d.expenses]), 1);
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center gap-0.5" style={{ height: 100 }}>
            <div
              className="w-3 bg-indigo-400 rounded-t-sm"
              style={{ height: `${max > 0 ? (d.revenue / max) * 100 : 0}%` }}
              title={`売上: ${d.revenue.toLocaleString()}`}
            />
            <div
              className="w-3 bg-orange-400 rounded-t-sm"
              style={{ height: `${max > 0 ? (d.expenses / max) * 100 : 0}%` }}
              title={`経費: ${d.expenses.toLocaleString()}`}
            />
            {d.profit > 0 && (
              <div
                className="w-3 bg-emerald-400 rounded-t-sm"
                style={{ height: `${max > 0 ? (d.profit / max) * 100 : 0}%` }}
                title={`利益: ${d.profit.toLocaleString()}`}
              />
            )}
          </div>
          <span className="text-[10px] text-zinc-400">{d.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}
