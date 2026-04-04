'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, FileText, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import StatusBadge from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';
import type { DocumentHeader } from '@/types';

interface Props {
  initialData: { items: DocumentHeader[]; nextCursor?: string };
}

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatAmount(n: number): string {
  return '¥' + n.toLocaleString('ja-JP');
}

export default function InvoiceListClient({ initialData }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return initialData.items.filter((doc) => {
      if (doc.isDeleted) return false;
      const matchStatus = statusFilter === 'all' || doc.status === statusFilter;
      if (!matchStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !doc.documentNumber.toLowerCase().includes(q) &&
          !doc.clientName.toLowerCase().includes(q) &&
          !doc.subject.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (new Date(doc.issueDate) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(doc.issueDate) > to) return false;
      }
      return true;
    });
  }, [initialData.items, search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };
  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };
  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    setCurrentPage(1);
  };
  const handleDateToChange = (val: string) => {
    setDateTo(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>請求書</h2>
            <p className="text-sm mt-0.5" style={{ color: '#9098a8' }}>{initialData.items.length}件の請求書</p>
          </div>
          <Button asChild>
            <Link href="/invoices/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新規作成
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
            <Input
              placeholder="帳票番号・取引先・件名で検索"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="draft">下書き</SelectItem>
              <SelectItem value="pending_approval">承認待ち</SelectItem>
              <SelectItem value="approved">承認済み</SelectItem>
              <SelectItem value="confirmed">確定</SelectItem>
              <SelectItem value="sent">送付済み</SelectItem>
              <SelectItem value="paid">入金済み</SelectItem>
              <SelectItem value="overdue">延滞</SelectItem>
              <SelectItem value="cancelled">取消済み</SelectItem>
              <SelectItem value="rejected">差戻し</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="w-36 text-sm"
              placeholder="開始日"
            />
            <span className="text-sm" style={{ color: 'rgba(0,0,0,0.3)' }}>〜</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="w-36 text-sm"
              placeholder="終了日"
            />
          </div>
        </div>

        {/* Result count */}
        <p className="text-sm" style={{ color: '#9098a8' }}>{filtered.length} 件</p>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>帳票番号</TableHead>
                <TableHead>取引先</TableHead>
                <TableHead>件名</TableHead>
                <TableHead>発行日</TableHead>
                <TableHead>支払期限</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3" style={{ color: 'rgba(0,0,0,0.3)' }}>
                      <FileText className="h-10 w-10 opacity-30" />
                      <p className="text-sm font-medium">請求書がありません</p>
                      <p className="text-xs">「新規作成」から請求書を作成してください</p>
                    </div>
                  </td>
                </TableRow>
              ) : (
                paged.map((doc) => (
                  <TableRow
                    key={doc.documentId}
                    className="cursor-pointer"
                    onClick={() => router.push(`/invoices/${doc.documentId}`)}
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      {doc.documentNumber}
                    </TableCell>
                    <TableCell className="font-medium">{doc.clientName}</TableCell>
                    <TableCell className="max-w-48 truncate" style={{ color: '#6b7280' }}>{doc.subject}</TableCell>
                    <TableCell className="text-xs" style={{ color: '#9098a8' }}>{formatDate(doc.issueDate)}</TableCell>
                    <TableCell className={cn('text-xs', doc.status === 'overdue' ? 'text-red-400 font-medium' : '')} style={doc.status !== 'overdue' ? { color: '#9098a8' } : {}}>
                      {doc.dueDate ? formatDate(doc.dueDate) : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatAmount(doc.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {doc.status === 'draft' && (
                          <Link
                            href={`/invoices/${doc.documentId}/edit`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="編集"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        <ChevronRight className="h-4 w-4" style={{ color: 'rgba(0,0,0,0.25)' }} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              前へ
            </Button>
            <span className="text-sm" style={{ color: '#71717a' }}>
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              次へ
            </Button>
          </div>
        )}
    </div>
  );
}
