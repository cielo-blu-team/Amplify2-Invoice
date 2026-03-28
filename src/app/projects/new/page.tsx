'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { showSuccess, showError } from '@/lib/toast';
import { createProject } from '@/actions/project';

export default function ProjectNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    projectName: '',
    clientName: '',
    clientId: '',
    status: 'planning' as const,
    priority: 'medium' as const,
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    assignedTo: '',
    notes: '',
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createProject({
        ...form,
        budget: form.budget ? parseInt(form.budget, 10) : undefined,
        createdBy: 'current-user',
      });
      if (!result.success) {
        showError(result.error?.message ?? '作成に失敗しました');
        return;
      }
      showSuccess('案件を作成しました');
      router.push(`/projects/${result.data!.projectId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          案件一覧
        </button>
      </div>
      <h2 className="text-2xl font-bold text-zinc-900">新規案件登録</h2>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>案件名 <span className="text-red-500">*</span></Label>
              <Input
                value={form.projectName}
                onChange={(e) => set('projectName', e.target.value)}
                placeholder="案件名を入力"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>ステータス</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">計画中</SelectItem>
                    <SelectItem value="in_progress">進行中</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="suspended">中断</SelectItem>
                    <SelectItem value="lost">失注</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>優先度</Label>
                <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>取引先名</Label>
              <Input
                value={form.clientName}
                onChange={(e) => set('clientName', e.target.value)}
                placeholder="取引先名を入力"
              />
            </div>

            <div className="space-y-1.5">
              <Label>担当者</Label>
              <Input
                value={form.assignedTo}
                onChange={(e) => set('assignedTo', e.target.value)}
                placeholder="担当者名を入力"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>開始日</Label>
                <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>終了予定日</Label>
                <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>予算（円）</Label>
              <Input
                type="number"
                min={0}
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="例: 1000000"
              />
            </div>

            <div className="space-y-1.5">
              <Label>案件概要</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="案件の概要・目的を入力"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>備考</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="その他メモを入力"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '作成中...' : '案件を作成'}
          </Button>
        </div>
      </form>
    </div>
  );
}
