'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileStack, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import ConfirmModal from '@/components/common/ConfirmModal';
import { showSuccess, showError } from '@/lib/toast';
import { deleteTemplate } from '@/actions/template';
import type { DocumentTemplate } from '@/types/template';

interface Props {
  initialTemplates: DocumentTemplate[];
}

const DOCUMENT_TYPE_LABELS: Record<DocumentTemplate['documentType'], string> = {
  estimate: '見積書',
  invoice: '請求書',
  both: '両方',
};

const DOCUMENT_TYPE_BADGE_CLASS: Record<DocumentTemplate['documentType'], string> = {
  estimate: 'bg-blue-100 text-blue-800',
  invoice: 'bg-teal-100 text-teal-800',
  both: 'bg-violet-100 text-violet-800',
};

export default function TemplateListClient({ initialTemplates }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<DocumentTemplate[]>(initialTemplates);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteTemplate(deleteTarget.templateId);
      if (result.success) {
        setItems((prev) => prev.filter((t) => t.templateId !== deleteTarget.templateId));
        showSuccess('テンプレートを削除しました');
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>テンプレート管理</h2>
          <Button onClick={() => router.push('/templates/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新規テンプレート作成
          </Button>
        </div>

        <p className="text-sm" style={{ color: '#9098a8' }}>{items.length} 件</p>

        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>テンプレート名</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>明細行数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((template) => (
                  <TableRow key={template.templateId}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>
                      <Badge variant={template.documentType === 'estimate' ? 'info' : template.documentType === 'invoice' ? 'cyan' : 'purple'}>
                        {DOCUMENT_TYPE_LABELS[template.documentType]}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.lineItems.length} 行</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="編集"
                          onClick={() => router.push(`/templates/${template.templateId}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="削除"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2" style={{ color: '#9098a8' }}>
                      <FileStack className="h-8 w-8" />
                      <span>テンプレートがありません</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <ConfirmModal
          opened={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title="テンプレート削除"
          message={`「${deleteTarget?.name ?? ''}」を削除しますか？この操作は元に戻せません。`}
          confirmLabel="削除"
          variant="destructive"
          loading={deleting}
        />
    </div>
  );
}
