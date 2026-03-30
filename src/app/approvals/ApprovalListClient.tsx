'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { showSuccess, showError } from '@/lib/toast';
import type { DocumentHeader } from '@/types/document';
import { approveDocument, rejectDocument } from '@/actions/approval';

interface Props {
  initialData: { items: DocumentHeader[]; cursor?: string };
  approverId: string;
  approverName: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}年${m}月${day}日`;
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  estimate: '見積書',
  invoice: '請求書',
};

export default function ApprovalListClient({ initialData, approverId, approverName }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<DocumentHeader[]>(
    initialData.items.filter((doc) => !doc.isDeleted && doc.status === 'pending_approval'),
  );
  const [isPending, startTransition] = useTransition();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<DocumentHeader | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const handleApprove = (doc: DocumentHeader) => {
    startTransition(async () => {
      const res = await approveDocument(doc.documentId, approverId, approverName);
      if (res.success) {
        showSuccess(`${doc.documentNumber} を承認しました`);
        setItems((prev) => prev.filter((d) => d.documentId !== doc.documentId));
        router.refresh();
      } else {
        showError(res.error?.message ?? '承認に失敗しました');
      }
    });
  };

  const openRejectDialog = (doc: DocumentHeader) => {
    setRejectTarget(doc);
    setRejectComment('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectTarget) return;
    if (!rejectComment.trim()) {
      showError('差戻し理由を入力してください');
      return;
    }
    const target = rejectTarget;
    startTransition(async () => {
      const res = await rejectDocument(
        target.documentId,
        approverId,
        approverName,
        rejectComment,
      );
      if (res.success) {
        showSuccess(`${target.documentNumber} を差戻しました`);
        setItems((prev) => prev.filter((d) => d.documentId !== target.documentId));
        setRejectDialogOpen(false);
        router.refresh();
      } else {
        showError(res.error?.message ?? '差戻しに失敗しました');
      }
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>承認</h2>
        <p className="text-sm mt-1" style={{ color: '#9098a8' }}>
          {items.length > 0
            ? `${items.length} 件の承認待ち帳票があります`
            : '承認待ちの帳票はありません'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,0,0,0.05)' }}>
            <CheckSquare className="h-8 w-8" style={{ color: 'rgba(0,0,0,0.3)' }} />
          </div>
          <p className="font-medium" style={{ color: '#374151' }}>承認待ちの帳票はありません</p>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>すべての帳票が処理済みです</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((doc) => (
            <Card key={doc.documentId} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ color: '#0f0f1a' }}>{doc.documentNumber}</span>
                      <Badge variant={doc.documentType === 'invoice' ? 'info' : 'purple'} className="text-xs">
                        {DOC_TYPE_LABELS[doc.documentType]}
                      </Badge>
                    </div>
                    <p className="text-sm" style={{ color: '#6b7280' }}>{doc.clientName}</p>
                    {doc.subject && (
                      <p className="text-sm" style={{ color: '#9098a8' }}>{doc.subject}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#6b7280' }}>
                      <span>依頼日: {formatDate(doc.createdAt)}</span>
                      <span className="font-medium" style={{ color: '#374151' }}>{formatAmount(doc.totalAmount)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="success"
                      disabled={isPending}
                      onClick={() => handleApprove(doc)}
                      className="gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      承認
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => openRejectDialog(doc)}
                      className="gap-1.5"
                      style={{ borderColor: 'rgba(239,68,68,0.25)', color: '#dc2626' }}
                    >
                      <X className="h-4 w-4" />
                      差戻し
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 差戻しダイアログ */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>差戻し確認</DialogTitle>
            <DialogDescription>
              {rejectTarget && (
                <>
                  <strong>{rejectTarget.documentNumber}</strong> を差戻します。差戻し理由を入力してください。
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#374151' }}>
              差戻し理由 <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="差戻し理由を入力してください"
              rows={4}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.currentTarget.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleRejectConfirm}
            >
              差戻す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
