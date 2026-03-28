'use client';

import {
  AlertTriangle,
  TrendingUp,
  Wallet,
  FileText,
  BarChart2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DashboardData } from '@/services/dashboard.service';

interface Props {
  initialData: DashboardData;
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

function getDocumentTypeBadge(type: 'estimate' | 'invoice'): { label: string; variant: 'info' | 'cyan' } {
  if (type === 'invoice') return { label: '請求書', variant: 'info' };
  return { label: '見積書', variant: 'cyan' };
}

function getStatusBadge(status: string): { label: string; variant: 'secondary' | 'info' | 'success' | 'destructive' | 'warning' | 'default' } {
  const map: Record<string, { label: string; variant: 'secondary' | 'info' | 'success' | 'destructive' | 'warning' | 'default' }> = {
    draft: { label: '下書き', variant: 'secondary' },
    sent: { label: '送付済', variant: 'info' },
    approved: { label: '承認済', variant: 'success' },
    paid: { label: '入金済', variant: 'success' },
    cancelled: { label: 'キャンセル', variant: 'destructive' },
    rejected: { label: '却下', variant: 'warning' },
  };
  return map[status] ?? { label: status, variant: 'secondary' };
}

export default function DashboardClient({ initialData }: Props) {
  const { monthlySales, unpaidSummary, winRate, overdueAlerts, recentDocuments } = initialData;

  const latestMonth = monthlySales[monthlySales.length - 1];
  const paidRatio =
    latestMonth && latestMonth.invoiceAmount > 0
      ? Math.round((latestMonth.paidAmount / latestMonth.invoiceAmount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>ダッシュボード</h2>

      {/* KPI カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 今月売上 */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: '#71717a' }}>今月売上</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>
              {latestMonth ? formatAmount(latestMonth.invoiceAmount) : '—'}
            </p>
            {latestMonth && (
              <p className="text-xs mt-1" style={{ color: '#9098a8' }}>
                入金済: {formatAmount(latestMonth.paidAmount)}
              </p>
            )}
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${paidRatio}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* 未入金残高 */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: '#71717a' }}>未入金残高</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
                <Wallet className="h-4 w-4 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {formatAmount(unpaidSummary.totalUnpaid)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#9098a8' }}>
              {unpaidSummary.count}件（30日超: {formatAmount(unpaidSummary.overdue30)}）
            </p>
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <div className="h-1 bg-orange-400 rounded-full" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* 延滞件数 */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: '#71717a' }}>延滞件数</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className={cn('text-2xl font-bold', overdueAlerts.length > 0 ? 'text-red-400' : '')} style={overdueAlerts.length === 0 ? { color: '#0f0f1a' } : {}}>
                {overdueAlerts.length}
              </p>
              {overdueAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">要対応</Badge>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: '#9098a8' }}>件の延滞案件</p>
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <div className="h-1 bg-red-500 rounded-full" style={{ width: overdueAlerts.length > 0 ? '100%' : '0%' }} />
            </div>
          </CardContent>
        </Card>

        {/* 受注率 */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: '#71717a' }}>受注率</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <BarChart2 className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <p className={cn('text-2xl font-bold', winRate.winRate >= 70 ? 'text-emerald-400' : winRate.winRate >= 50 ? 'text-amber-400' : 'text-red-400')}>
              {winRate.winRate}%
            </p>
            <p className="text-xs mt-1" style={{ color: '#9098a8' }}>
              {winRate.convertedToInvoice} / {winRate.totalEstimates} 件
            </p>
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <div
                className={cn('h-1 rounded-full', winRate.winRate >= 70 ? 'bg-emerald-500' : winRate.winRate >= 50 ? 'bg-amber-400' : 'bg-red-500')}
                style={{ width: `${winRate.winRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 月次売上推移テーブル */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">月次売上推移（過去6ヶ月）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>月</TableHead>
                <TableHead className="text-right">請求額</TableHead>
                <TableHead className="text-right">入金額</TableHead>
                <TableHead className="text-right">入金率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlySales.map((row) => {
                const rate =
                  row.invoiceAmount > 0
                    ? Math.round((row.paidAmount / row.invoiceAmount) * 100)
                    : 0;
                return (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.invoiceAmount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.paidAmount)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'destructive'} className="text-xs">
                        {rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 延滞アラート */}
      {overdueAlerts.length > 0 && (
        <Card style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              延滞アラート
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>書類番号</TableHead>
                  <TableHead>取引先</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>期限日</TableHead>
                  <TableHead className="text-right">延滞日数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueAlerts.map((alert) => (
                  <TableRow key={alert.documentId}>
                    <TableCell className="font-medium">{alert.documentNumber}</TableCell>
                    <TableCell>{alert.clientName}</TableCell>
                    <TableCell className="text-right">{formatAmount(alert.totalAmount)}</TableCell>
                    <TableCell>{alert.dueDate}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        {alert.daysOverdue}日超過
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 最近の帳票 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            最近の帳票
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>書類番号</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>取引先</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>作成日時</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDocuments.map((doc) => {
                const typeBadge = getDocumentTypeBadge(doc.documentType);
                const statusBadge = getStatusBadge(doc.status);
                return (
                  <TableRow key={doc.documentId}>
                    <TableCell className="font-medium">{doc.documentNumber}</TableCell>
                    <TableCell>
                      <Badge variant={typeBadge.variant} className="text-xs">
                        {typeBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.clientName}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant} className="text-xs">
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatAmount(doc.totalAmount)}</TableCell>
                    <TableCell className="text-xs" style={{ color: '#6b7280' }}>
                      {new Date(doc.createdAt).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
