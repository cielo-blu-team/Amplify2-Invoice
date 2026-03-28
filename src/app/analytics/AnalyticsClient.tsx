'use client';

import { useState } from 'react';
import {
  BarChart2, TrendingUp, Users, FolderKanban,
  Wallet, ArrowUpRight, ArrowDownRight, CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  OverallAnalytics, ClientAnalytics, ProjectAnalytics,
} from '@/services/analytics.service';

interface Props {
  overall: OverallAnalytics | null;
  clients: ClientAnalytics[];
  projects: ProjectAnalytics | null;
}

function fmt(n: number) { return '¥' + n.toLocaleString('ja-JP'); }
function fmtM(n: number) { return '¥' + (n / 10000).toLocaleString('ja-JP') + '万'; }

// ── Horizontal Bar ──────────────────────────────────────────────────
function HBar({ value, max, color = 'bg-indigo-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Donut Chart (SVG) ─────────────────────────────────────────────
function DonutChart({ segments }: { segments: { count: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  let cumulative = 0;
  const r = 60;
  const cx = 80;
  const cy = 80;
  const stroke = 22;

  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.count / total : 0;
    const startAngle = cumulative * 360 - 90;
    const endAngle = (cumulative + pct) * 360 - 90;
    cumulative += pct;

    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
    return { ...seg, d, pct: Math.round(pct * 100) };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-2xl font-bold" style={{ fontSize: 22, fontWeight: 700, fill: '#18181b' }}>{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fill: '#71717a' }}>件</text>
      </svg>
      <div className="space-y-2">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="text-zinc-600 w-14">{arc.label}</span>
            <span className="font-semibold text-zinc-900 w-6 text-right">{arc.count}</span>
            <span className="text-zinc-400 text-xs">({arc.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── Monthly Bar Chart ──────────────────────────────────────────────
function MonthlyBarChart({ data }: { data: { month: string; invoiced: number; paid: number }[] }) {
  const max = Math.max(...data.map((d) => d.invoiced));
  return (
    <div className="flex items-end gap-3 h-40 pt-4">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: 120 }}>
            <div
              className="w-full bg-indigo-200 rounded-t-sm"
              style={{ height: `${max > 0 ? (d.invoiced / max) * 100 : 0}%`, position: 'relative' }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-sm"
                style={{ height: `${d.invoiced > 0 ? (d.paid / d.invoiced) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-zinc-400">{d.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────
type Tab = 'overall' | 'clients' | 'projects';

// ════════════════════════════════════════════════════════════════
export default function AnalyticsClient({ overall, clients, projects }: Props) {
  const [tab, setTab] = useState<Tab>('overall');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overall',  label: '全体概要',   icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'clients',  label: '取引先分析', icon: <Users className="h-4 w-4" /> },
    { id: 'projects', label: '案件分析',   icon: <FolderKanban className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">分析</h2>
          <p className="text-sm text-zinc-500 mt-0.5">取引先・案件のパフォーマンスを可視化</p>
        </div>
        <Badge variant="secondary" className="text-xs">プロトタイプ（モックデータ）</Badge>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overall ── */}
      {tab === 'overall' && overall && (
        <div className="space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '累計売上',     value: fmtM(overall.totalRevenue),  sub: `入金済: ${fmtM(overall.totalPaid)}`,       icon: TrendingUp,   color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: '未入金残高',   value: fmtM(overall.totalUnpaid),   sub: `入金率: ${overall.avgPaymentRate}%`,        icon: Wallet,       color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: '取引先数',     value: `${overall.totalClients}社`,  sub: 'アクティブ取引先',                          icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50' },
              { label: '案件数',       value: `${overall.totalProjects}件`, sub: '登録案件総数',                              icon: FolderKanban, color: 'text-green-600',  bg: 'bg-green-50' },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{kpi.label}</span>
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', kpi.bg)}>
                      <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900">{kpi.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly trend + payment rate */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-700">月次売上推移（過去6ヶ月）</CardTitle>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-200 inline-block" />請求額</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-500 inline-block" />入金額</span>
                </div>
              </CardHeader>
              <CardContent>
                <MonthlyBarChart data={overall.monthlyTrend} />
                <div className="mt-3 grid grid-cols-6 gap-3 text-xs text-center">
                  {overall.monthlyTrend.map((d) => (
                    <div key={d.month}>
                      <p className="font-semibold text-zinc-800">{fmtM(d.invoiced)}</p>
                      <p className="text-zinc-400">{Math.round((d.paid / d.invoiced) * 100)}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-700">入金率</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="text-center py-4">
                  <p className="text-5xl font-bold text-indigo-600">{overall.avgPaymentRate}%</p>
                  <p className="text-sm text-zinc-500 mt-2">平均入金率</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span>入金済</span><span className="font-semibold">{fmtM(overall.totalPaid)}</span>
                  </div>
                  <HBar value={overall.totalPaid} max={overall.totalRevenue} color="bg-green-500" />
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span>未入金</span><span className="font-semibold text-orange-600">{fmtM(overall.totalUnpaid)}</span>
                  </div>
                  <HBar value={overall.totalUnpaid} max={overall.totalRevenue} color="bg-orange-400" />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700">入金率は良好な水準です</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Client Analysis ── */}
      {tab === 'clients' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top clients by revenue */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-700">取引先別売上ランキング</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {clients.map((c, i) => {
                  const maxRevenue = clients[0]?.totalInvoiced ?? 1;
                  return (
                    <div key={c.clientId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                            i === 0 ? 'bg-amber-100 text-amber-700' :
                            i === 1 ? 'bg-zinc-200 text-zinc-600' :
                            i === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-zinc-100 text-zinc-500'
                          )}>{i + 1}</span>
                          <span className="truncate font-medium text-zinc-800">{c.clientName}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className={cn(
                            'text-xs font-semibold px-1.5 py-0.5 rounded',
                            c.paymentRate >= 90 ? 'bg-green-50 text-green-700' :
                            c.paymentRate >= 70 ? 'bg-yellow-50 text-yellow-700' :
                            'bg-red-50 text-red-700'
                          )}>{c.paymentRate}%</span>
                          <span className="font-semibold text-zinc-900 text-sm">{fmtM(c.totalInvoiced)}</span>
                        </div>
                      </div>
                      <HBar
                        value={c.totalInvoiced}
                        max={maxRevenue}
                        color={i === 0 ? 'bg-indigo-500' : i <= 2 ? 'bg-indigo-400' : 'bg-indigo-300'}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-700">入金率トップ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[...clients].sort((a, b) => b.paymentRate - a.paymentRate).slice(0, 4).map((c) => (
                    <div key={c.clientId} className="flex items-center justify-between text-sm">
                      <span className="truncate text-zinc-600 max-w-36">{c.clientName}</span>
                      <div className="flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                        <span className="font-semibold text-green-600">{c.paymentRate}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-700">未入金上位</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[...clients].sort((a, b) => b.unpaid - a.unpaid).slice(0, 4).map((c) => (
                    <div key={c.clientId} className="flex items-center justify-between text-sm">
                      <span className="truncate text-zinc-600 max-w-36">{c.clientName}</span>
                      <div className="flex items-center gap-1">
                        <ArrowDownRight className="h-3 w-3 text-orange-500" />
                        <span className="font-semibold text-orange-600">{fmtM(c.unpaid)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Detailed table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-700">取引先詳細</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      {['取引先', '請求額', '入金額', '未入金', '入金率', '受注率', '請求件数', '最終取引'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {clients.map((c) => (
                      <tr key={c.clientId} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-900">{c.clientName}</td>
                        <td className="px-4 py-3 text-zinc-700">{fmt(c.totalInvoiced)}</td>
                        <td className="px-4 py-3 text-zinc-700">{fmt(c.totalPaid)}</td>
                        <td className="px-4 py-3">
                          <span className={c.unpaid > 0 ? 'text-orange-600 font-medium' : 'text-zinc-400'}>
                            {c.unpaid > 0 ? fmt(c.unpaid) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-semibold',
                            c.paymentRate >= 90 ? 'bg-green-50 text-green-700' :
                            c.paymentRate >= 70 ? 'bg-yellow-50 text-yellow-700' :
                            'bg-red-50 text-red-700'
                          )}>{c.paymentRate}%</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{c.winRate}%</td>
                        <td className="px-4 py-3 text-zinc-600">{c.invoiceCount}件</td>
                        <td className="px-4 py-3 text-zinc-400 text-xs">{c.lastTransactionDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Project Analysis ── */}
      {tab === 'projects' && projects && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Status donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-700">ステータス分布</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart segments={projects.statusDistribution} />
              </CardContent>
            </Card>

            {/* Priority donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-700">優先度分布</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart segments={projects.priorityDistribution} />
              </CardContent>
            </Card>

            {/* Budget summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-700">予算サマリー</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-2">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">総予算</p>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">{fmtM(projects.budgetSummary.totalBudget)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">平均予算</p>
                    <p className="text-lg font-bold text-zinc-800 mt-0.5">{fmtM(projects.budgetSummary.avgBudget)}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">案件数</p>
                    <p className="text-lg font-bold text-zinc-800 mt-0.5">{projects.budgetSummary.projectCount}件</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly created + assignee */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-700">月次新規案件数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-36">
                  {projects.monthlyCreated.map((d) => {
                    const max = Math.max(...projects.monthlyCreated.map((x) => x.count));
                    const pct = max > 0 ? (d.count / max) * 100 : 0;
                    return (
                      <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-zinc-700">{d.count}</span>
                        <div className="w-full bg-zinc-100 rounded-t-sm" style={{ height: 80 }}>
                          <div
                            className="w-full bg-indigo-400 rounded-t-sm mt-auto"
                            style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-400">{d.month.slice(5)}月</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-700">担当者別案件数</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projects.assigneeStats.map((a) => {
                  const max = projects.assigneeStats[0]?.count ?? 1;
                  return (
                    <div key={a.assignedTo} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-700">{a.assignedTo}</span>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>{fmtM(a.totalBudget)}</span>
                          <span className="font-semibold text-zinc-800">{a.count}件</span>
                        </div>
                      </div>
                      <HBar value={a.count} max={max} color="bg-indigo-400" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
