'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, FolderKanban, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
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
import ConfirmModal from '@/components/common/ConfirmModal';
import { showSuccess, showError } from '@/lib/toast';
import { deleteProject } from '@/actions/project';
import type { Project, ProjectStatus, ProjectPriority } from '@/types';

interface Props {
  initialData: { items: Project[]; cursor?: string };
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: 'secondary' | 'info' | 'success' | 'destructive' | 'warning' | 'default' }> = {
  planning:    { label: '計画中',   variant: 'secondary' },
  in_progress: { label: '進行中',   variant: 'info' },
  completed:   { label: '完了',     variant: 'success' },
  suspended:   { label: '中断',     variant: 'warning' },
  lost:        { label: '失注',     variant: 'destructive' },
};

const PRIORITY_CONFIG: Record<ProjectPriority, { label: string; variant: 'default' | 'warning' | 'destructive' }> = {
  low:    { label: '低', variant: 'default' },
  medium: { label: '中', variant: 'warning' },
  high:   { label: '高', variant: 'destructive' },
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatBudget(n?: number) {
  if (n == null) return '—';
  return '¥' + n.toLocaleString('ja-JP');
}

export default function ProjectListClient({ initialData }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [items, setItems] = useState<Project[]>(initialData.items);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.projectName.toLowerCase().includes(q) ||
          (p.clientName ?? '').toLowerCase().includes(q) ||
          (p.assignedTo ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteProject(deleteTarget.projectId);
      if (result.success) {
        setItems((prev) => prev.filter((p) => p.projectId !== deleteTarget.projectId));
        showSuccess('案件を削除しました');
      } else {
        showError('削除に失敗しました');
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>案件管理</h2>
          <p className="text-sm mt-0.5" style={{ color: '#9098a8' }}>{filtered.length}件の案件</p>
        </div>
        <Button onClick={() => router.push('/projects/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新規案件
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
          <Input
            placeholder="案件名・取引先・担当者で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>案件名</TableHead>
              <TableHead>取引先</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>優先度</TableHead>
              <TableHead>担当者</TableHead>
              <TableHead>開始日</TableHead>
              <TableHead>終了予定日</TableHead>
              <TableHead className="text-right">予算</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <td colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3" style={{ color: 'rgba(0,0,0,0.3)' }}>
                    <FolderKanban className="h-10 w-10 opacity-30" />
                    <p className="text-sm font-medium">案件がありません</p>
                    <p className="text-xs">「新規案件」から案件を登録してください</p>
                  </div>
                </td>
              </TableRow>
            ) : (
              filtered.map((project) => {
                const s = STATUS_CONFIG[project.status];
                const pr = PRIORITY_CONFIG[project.priority];
                return (
                  <TableRow
                    key={project.projectId}
                    className="cursor-pointer"
                    onClick={() => router.push(`/projects/${project.projectId}`)}
                  >
                    <TableCell className="font-medium">{project.projectName}</TableCell>
                    <TableCell style={{ color: '#6b7280' }}>{project.clientName ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pr.variant} className="text-xs">{pr.label}</Badge>
                    </TableCell>
                    <TableCell style={{ color: '#6b7280' }}>{project.assignedTo ?? '—'}</TableCell>
                    <TableCell className="text-xs" style={{ color: '#9098a8' }}>{formatDate(project.startDate)}</TableCell>
                    <TableCell className="text-xs" style={{ color: '#9098a8' }}>{formatDate(project.endDate)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatBudget(project.budget)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'rgba(0,0,0,0.3)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(248,113,113,0.8)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(0,0,0,0.3)')}
                          title="削除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4" style={{ color: 'rgba(0,0,0,0.25)' }} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="案件の削除"
        message={`「${deleteTarget?.projectName ?? ''}」を削除しますか？この操作は元に戻せません。`}
        confirmLabel="削除"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}
