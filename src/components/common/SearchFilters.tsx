'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onStatusFilter: (status: string | null) => void;
  onDateRangeFilter: (from: string | null, to: string | null) => void;
  statusOptions: { value: string; label: string }[];
}

export default function SearchFilters({
  onSearch,
  onStatusFilter,
  onDateRangeFilter,
  statusOptions,
}: SearchFiltersProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleSearch = () => {
    onSearch(query);
    onStatusFilter(status || null);
    onDateRangeFilter(dateFrom || null, dateTo || null);
  };

  const handleReset = () => {
    setQuery('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    onSearch('');
    onStatusFilter(null);
    onDateRangeFilter(null, null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* キーワード検索 */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <Label htmlFor="search-query">キーワード検索</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              id="search-query"
              placeholder="帳票番号・取引先名など"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* ステータス */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label>ステータス</Label>
          <Select value={status} onValueChange={(val) => setStatus(val === '__all__' ? '' : val)}>
            <SelectTrigger>
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">すべて</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 発行日（開始） */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label htmlFor="date-from">発行日（開始）</Label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* 発行日（終了） */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label htmlFor="date-to">発行日（終了）</Label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button onClick={handleSearch}>検索</Button>
          <Button variant="outline" onClick={handleReset}>
            リセット
          </Button>
        </div>
      </div>
    </div>
  );
}
