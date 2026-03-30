'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, XCircle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmModal from '@/components/common/ConfirmModal';
import { showSuccess, showError } from '@/lib/toast';
import {
  cancelDocument,
  duplicateDocument,
  sendDocument,
} from '@/actions/document';
import { requestApproval } from '@/actions/approval';
import { updatePaymentStatus } from '@/actions/payment';
import { cn } from '@/lib/utils';
import type { DocumentHeader } from '@/types';

interface Props {
  document: DocumentHeader;
  userId: string;
  userName: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatAmount(n: number): string {
  return n.toLocaleString('ja-JP') + ' 円';
}

export default function InvoiceDetailClient({ document: doc, userId, userName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Send confirm modal
  const [sendOpen, setSendOpen] = useState(false);

  // Paid confirm modal
  const [paidOpen, setPaidOpen] = useState(false);

  const canRequestApproval = doc.status === 'draft';
  const canSend = doc.status === 'confirmed';
  const canCancel = doc.status === 'draft' || doc.status === 'confirmed';
  const canMarkPaid = doc.status === 'sent' || doc.status === 'overdue';

  const handleRequestApproval = async () => {
    setLoading(true);
    try {
      const result = await requestApproval(doc.documentId, userId, userName);
      if (!result.success) {
        showError(result.error?.message ?? '承認依頼に失敗しました');
        return;
      }
      showSuccess('承認依頼を送信しました');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      const result = await sendDocument(doc.documentId);
      if (!result.success) {
        showError(result.error?.message ?? '送付処理に失敗しました');
        return;
      }
      showSuccess('送付済みに更新しました');
      setSendOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      showError('取消理由を入力してください');
      return;
    }
    setLoading(true);
    try {
      const result = await cancelDocument(doc.documentId, cancelReason);
      if (!result.success) {
        showError(result.error?.message ?? '取消処理に失敗しました');
        return;
      }
      showSuccess('帳票を取消しました');
      setCancelOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setLoading(true);
    try {
      const result = await duplicateDocument(doc.documentId, userId);
      if (!result.success) {
        showError(result.error?.message ?? '複製に失敗しました');
        return;
      }
      showSuccess('請求書を複製しました');
      router.push(`/invoices/${result.data!.documentId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      const result = await updatePaymentStatus(doc.documentId, 'paid');
      if (!result.success) {
        showError(result.error?.message ?? '入金済み更新に失敗しました');
        return;
      }
      showSuccess('入金済みに更新しました');
      setPaidOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        {/* Back link */}
        <div>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#9098a8' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0f0f1a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9098a8')}
          >
            <ArrowLeft className="h-4 w-4" />
            請求書一覧
          </Link>
        </div>

        {/* Header card */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Document number + status + client */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-2xl font-bold tracking-wide" style={{ color: '#0f0f1a' }}>
                      {doc.documentNumber}
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-lg font-medium" style={{ color: '#374151' }}>{doc.clientName}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.pdfUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer" download>
                        PDFダウンロード
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/invoices/${doc.documentId}/preview`)}
                  >
                    PDFプレビュー
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium" style={{ color: '#71717a' }}>件名</p>
                  <p className="text-sm" style={{ color: '#0f0f1a' }}>{doc.subject}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium" style={{ color: '#71717a' }}>発行日</p>
                  <p className="text-sm text-zinc-800">{formatDate(doc.issueDate)}</p>
                </div>
                {doc.dueDate && (
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium" style={{ color: '#71717a' }}>支払期限</p>
                    <p
                      className={cn('text-sm font-medium', doc.status === 'overdue' ? 'text-red-500' : '')}
                      style={doc.status !== 'overdue' ? { color: '#0f0f1a' } : {}}
                    >
                      {formatDate(doc.dueDate)}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Amount summary */}
              <div className="flex items-end justify-end gap-8">
                <div className="text-right space-y-0.5">
                  <p className="text-xs font-medium" style={{ color: '#71717a' }}>小計</p>
                  <p className="text-sm" style={{ color: '#374151' }}>{formatAmount(doc.subtotal)}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-xs font-medium" style={{ color: '#71717a' }}>消費税</p>
                  <p className="text-sm" style={{ color: '#374151' }}>{formatAmount(doc.taxAmount)}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-xs font-medium" style={{ color: '#71717a' }}>合計</p>
                  <p className="text-xl font-bold" style={{ color: '#0f0f1a' }}>{formatAmount(doc.totalAmount)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-2">
              {canRequestApproval && (
                <Button onClick={handleRequestApproval} disabled={loading}>
                  承認依頼
                </Button>
              )}
              {canSend && (
                <Button
                  variant="success"
                  onClick={() => setSendOpen(true)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  送付済みにする
                </Button>
              )}
              {canMarkPaid && (
                <Button
                  onClick={() => setPaidOpen(true)}
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                  入金済み
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleDuplicate}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                複製
              </Button>
              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={() => setCancelOpen(true)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  取消
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {doc.notes && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">備考</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#71717a' }}>{doc.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Cancel reason */}
        {doc.cancelledReason && (
          <Card style={{ borderColor: 'rgba(239,68,68,0.2)', background: '#fef2f2' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-red-600">取消理由</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">{doc.cancelledReason}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cancel modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>帳票の取消</DialogTitle>
            <DialogDescription>
              この帳票を取消します。取消理由を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="block text-sm font-medium" style={{ color: '#374151' }}>
              取消理由 <span className="text-red-400">*</span>
            </label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none min-h-20"
              style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#0f0f1a' }}
              placeholder="取消理由を入力してください"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>
                キャンセル
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading ? '処理中...' : '取消を実行'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send confirm modal */}
      <ConfirmModal
        opened={sendOpen}
        onClose={() => setSendOpen(false)}
        onConfirm={handleSend}
        title="送付済みにする"
        message="この請求書を送付済みにします。よろしいですか？"
        confirmLabel="送付済みにする"
        loading={loading}
      />

      {/* Paid confirm modal */}
      <ConfirmModal
        opened={paidOpen}
        onClose={() => setPaidOpen(false)}
        onConfirm={handleMarkPaid}
        title="入金済みにする"
        message="この請求書を入金済みにします。よろしいですか？"
        confirmLabel="入金済みにする"
        loading={loading}
      />
    </>
  );
}
