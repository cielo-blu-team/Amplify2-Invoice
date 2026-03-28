'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Calendar, User, Building2, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ConfirmModal from '@/components/common/ConfirmModal';
import { showSuccess, showError } from '@/lib/toast';
import { deleteProject } from '@/actions/project';
import type { Project, ProjectStatus, ProjectPriority } from '@/types';

interface Props {
  project: Project;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: 'secondary' | 'info' | 'success' | 'destructive' | 'warning' | 'default' }> = {
  planning:    { label: '計画中', variant: 'secondary' },
  in_progress: { label: '進行中', variant: 'info' },
  completed:   { label: '完了',   variant: 'success' },
  suspended:   { label: '中断',   variant: 'warning' },
  lost:        { label: '失注',   variant: 'destructive' },
};

const PRIORITY_CONFIG: Record<ProjectPriority, { label: string; variant: 'default' | 'warning' | 'destructive' }> = {
  low:    { label: '低', variant: 'default' },
  medium: { label: '中', variant: 'warning' },
  high:   { label: '高', variant: 'destructive' },
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatBudget(n?: number) {
  if (n == null) return '—';
  return '¥' + n.toLocaleString('ja-JP');
}

export default function ProjectDetailClient({ project }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const s = STATUS_CONFIG[project.status];
  const pr = PRIORITY_CONFIG[project.priority];

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteProject(project.projectId);
      if (result.success) {
        showSuccess('案件を削除しました');
        router.push('/projects');
      } else {
        showError('削除に失敗しました');
      }
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-5 max-w-4xl">
        {/* Back */}
        <button
          onClick={() => router.push('/projects')}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          案件一覧
        </button>

        {/* Header */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-zinc-900">{project.projectName}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={s.variant}>{s.label}</Badge>
                    <Badge variant={pr.variant}>優先度: {pr.label}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/projects/${project.projectId}/edit`)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    編集
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    削除
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500">取引先</p>
                    <p className="font-medium text-zinc-900">{project.clientName ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500">担当者</p>
                    <p className="font-medium text-zinc-900">{project.assignedTo ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500">期間</p>
                    <p className="font-medium text-zinc-900">
                      {formatDate(project.startDate)} 〜 {formatDate(project.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500">予算</p>
                    <p className="font-medium text-zinc-900">{formatBudget(project.budget)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {project.description && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                案件概要
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {project.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-700">備考</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{project.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Meta */}
        <div className="text-xs text-zinc-400 space-y-1 px-1">
          <p>作成日時: {new Date(project.createdAt).toLocaleString('ja-JP')}</p>
          <p>最終更新: {new Date(project.updatedAt).toLocaleString('ja-JP')}</p>
        </div>
      </div>

      <ConfirmModal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="案件の削除"
        message={`「${project.projectName}」を削除しますか？この操作は元に戻せません。`}
        confirmLabel="削除"
        variant="destructive"
        loading={loading}
      />
    </>
  );
}
