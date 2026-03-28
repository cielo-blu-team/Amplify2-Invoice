'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuditLog } from '@/types';

interface Props {
  initialData: { items: AuditLog[]; cursor?: string };
}

const ACTION_TYPES = [
  { value: 'all', label: 'すべて' },
  { value: 'create', label: '作成' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '削除' },
  { value: 'cancel', label: 'キャンセル' },
  { value: 'approve', label: '承認' },
  { value: 'reject', label: '却下' },
  { value: 'send', label: '送付' },
];

type BadgeVariant = 'success' | 'info' | 'destructive' | 'warning' | 'secondary' | 'purple' | 'cyan' | 'default';

function getActionBadge(action: string): { variant: BadgeVariant; label: string } {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    create: { variant: 'success', label: '作成' },
    update: { variant: 'info', label: '更新' },
    delete: { variant: 'destructive', label: '削除' },
    cancel: { variant: 'warning', label: 'キャンセル' },
    approve: { variant: 'cyan', label: '承認' },
    reject: { variant: 'purple', label: '却下' },
    send: { variant: 'secondary', label: '送付' },
  };
  return map[action.toLowerCase()] ?? { variant: 'secondary', label: action };
}

const PAGE_SIZE = 20;

export default function AuditLogClient({ initialData }: Props) {
  const [actionType, setActionType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return initialData.items.filter((log) => {
      // 操作種別フィルタ
      if (actionType !== 'all' && !log.action.toLowerCase().startsWith(actionType)) {
        return false;
      }

      // 開始日フィルタ
      if (dateFrom) {
        const logDate = new Date(log.timestamp);
        if (logDate < new Date(dateFrom)) return false;
      }

      // 終了日フィルタ
      if (dateTo) {
        const logDate = new Date(log.timestamp);
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (logDate > endOfDay) return false;
      }

      // ユーザー検索フィルタ
      if (userSearch.trim()) {
        const q = userSearch.trim().toLowerCase();
        if (!log.userId.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [initialData.items, actionType, dateFrom, dateTo, userSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleActionTypeChange = (value: string) => {
    setActionType(value);
    setPage(1);
  };

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch(e.currentTarget.value);
    setPage(1);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.currentTarget.value);
    setPage(1);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.currentTarget.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>監査ログ</h2>

      {/* フィルタ */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: '#6b7280' }}>操作種別</label>
              <Select value={actionType} onValueChange={handleActionTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: '#6b7280' }}>開始日</label>
              <input
                type="date"
                className="flex h-9 w-full rounded-lg px-3 py-1 text-sm transition-all focus:outline-none"
                style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#0f0f1a' }}
                value={dateFrom}
                onChange={handleDateFromChange}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: '#6b7280' }}>終了日</label>
              <input
                type="date"
                className="flex h-9 w-full rounded-lg px-3 py-1 text-sm transition-all focus:outline-none"
                style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#0f0f1a' }}
                value={dateTo}
                onChange={handleDateToChange}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: '#6b7280' }}>ユーザー検索</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
                <Input
                  className="pl-8"
                  placeholder="ユーザーIDで検索"
                  value={userSearch}
                  onChange={handleUserSearchChange}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 件数表示 */}
      <p className="text-sm" style={{ color: '#9098a8' }}>{filtered.length} 件</p>

      {/* ログテーブル */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>操作者</TableHead>
                <TableHead>操作種別</TableHead>
                <TableHead>対象帳票番号</TableHead>
                <TableHead>詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10" style={{ color: '#9098a8' }}>
                    該当するログがありません
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((log) => {
                  const badge = getActionBadge(log.action);
                  const detailText = log.details
                    ? Object.entries(log.details)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')
                    : '—';
                  return (
                    <TableRow key={log.SK}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>{log.resourceId || '—'}</TableCell>
                      <TableCell>
                        <p
                          className="text-xs max-w-[300px] truncate" style={{ color: '#6b7280' }}
                          title={detailText}
                        >
                          {detailText}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm" style={{ color: '#71717a' }}>
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
