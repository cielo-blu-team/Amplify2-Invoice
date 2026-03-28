'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Client, BusinessType } from '@/types/client';

interface Props {
  initialData: { items: Client[]; cursor?: string };
}

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  corporation: '法人',
  individual: '個人',
  other: 'その他',
};

const BUSINESS_TYPE_VARIANTS: Record<BusinessType, 'info' | 'cyan' | 'secondary'> = {
  corporation: 'info',
  individual: 'cyan',
  other: 'secondary',
};

const PAGE_SIZE = 20;

export default function ClientListClient({ initialData }: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return initialData.items.filter((client) => {
      if (client.isDeleted) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        if (
          !client.clientName.toLowerCase().includes(k) &&
          !client.clientNameKana.toLowerCase().includes(k) &&
          !(client.phone ?? '').toLowerCase().includes(k) &&
          !(client.prefecture ?? '').toLowerCase().includes(k)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [initialData.items, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.currentTarget.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>取引先</h2>
        <Button onClick={() => router.push('/clients/new')} className="gap-1.5">
          <Plus className="h-4 w-4" />
          新規取引先
        </Button>
      </div>

      {/* 検索 */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
          <Input
            placeholder="取引先名・カナ・電話番号など"
            value={keyword}
            onChange={handleKeywordChange}
            className="pl-8"
          />
        </div>
      </div>

      <p className="text-sm" style={{ color: '#9098a8' }}>{filtered.length} 件</p>

      {/* テーブル */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>取引先名</TableHead>
              <TableHead>カナ</TableHead>
              <TableHead>区分</TableHead>
              <TableHead>電話</TableHead>
              <TableHead>メール</TableHead>
              <TableHead className="w-16 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length > 0 ? (
              paged.map((client, idx) => (
                <TableRow
                  key={client.clientId}
                  className="cursor-pointer"
                  onClick={() => router.push(`/clients/${client.clientId}/edit`)}
                >
                  <TableCell className="font-medium">{client.clientName}</TableCell>
                  <TableCell className="text-sm" style={{ color: '#71717a' }}>{client.clientNameKana}</TableCell>
                  <TableCell>
                    <Badge variant={BUSINESS_TYPE_VARIANTS[client.businessType]} className="text-xs">
                      {BUSINESS_TYPE_LABELS[client.businessType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: '#6b7280' }}>{client.phone ?? '—'}</TableCell>
                  <TableCell className="text-sm" style={{ color: '#6b7280' }}>{client.email ?? '—'}</TableCell>
                  <TableCell
                    className="text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/clients/${client.clientId}/edit`)}
                      className="h-8 w-8 p-0"
                      title="編集"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8" style={{ color: 'rgba(0,0,0,0.25)' }} />
                    <p style={{ color: '#9098a8' }}>該当する取引先がありません</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="h-8 w-8 p-0"
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
