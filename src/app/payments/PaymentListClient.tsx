'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { updatePaymentStatus } from '@/actions/payment';
import type { MatchStatus, PaymentMatchResult } from '@/services/payment.service';

// モックデータ（MoneyForward接続前）
const MOCK_RESULTS: PaymentMatchResult[] = [
  {
    documentId: 'doc-001',
    documentNumber: 'INV-20260101-001',
    clientName: '株式会社テスト',
    invoiceAmount: 110000,
    transferAmount: 110000,
    matchStatus: 'full',
    confidence: 100,
    transferId: 'TXN-001',
    needsManualReview: false,
  },
  {
    documentId: 'doc-002',
    documentNumber: 'INV-20260115-002',
    clientName: 'サンプル商事株式会社',
    invoiceAmount: 330000,
    transferAmount: 330000,
    matchStatus: 'full',
    confidence: 88,
    transferId: 'TXN-002',
    needsManualReview: false,
  },
  {
    documentId: 'doc-003',
    documentNumber: 'INV-20260120-003',
    clientName: 'フジヤマ工業株式会社',
    invoiceAmount: 220000,
    transferAmount: 110000,
    matchStatus: 'partial',
    confidence: 60,
    transferId: 'TXN-003',
    needsManualReview: true,
  },
  {
    documentId: 'doc-004',
    documentNumber: 'INV-20260201-004',
    clientName: 'グローバル物産',
    invoiceAmount: 55000,
    transferAmount: 60000,
    matchStatus: 'mismatch',
    confidence: 40,
    transferId: 'TXN-004',
    needsManualReview: true,
  },
];

const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  full: '完全一致',
  partial: '一部入金',
  mismatch: '金額不一致',
  unmatched: '未照合',
};

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary';

const MATCH_STATUS_VARIANTS: Record<MatchStatus, BadgeVariant> = {
  full: 'success',
  partial: 'warning',
  mismatch: 'destructive',
  unmatched: 'secondary',
};

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

export default function PaymentListClient() {
  const [results, setResults] = useState<PaymentMatchResult[]>(MOCK_RESULTS);
  const [confirming, setConfirming] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async (result: PaymentMatchResult) => {
    setConfirming((prev) => new Set(prev).add(result.documentId));
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await updatePaymentStatus(result.documentId, 'paid');
      if (response.success) {
        setResults((prev) => prev.filter((r) => r.documentId !== result.documentId));
        setSuccessMessage(`${result.documentNumber} の入金を確定しました`);
      } else {
        setErrorMessage(response.error?.message ?? '入金確定に失敗しました');
      }
    } catch {
      setErrorMessage('予期しないエラーが発生しました');
    } finally {
      setConfirming((prev) => {
        const next = new Set(prev);
        next.delete(result.documentId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>入金管理</h2>

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#9098a8' }}>照合件数: {results.length} 件</p>
        <p className="text-xs" style={{ color: '#9098a8' }}>※ モックデータ表示中（MoneyForward API未接続）</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>請求書番号</TableHead>
            <TableHead>取引先</TableHead>
            <TableHead className="text-right">請求金額</TableHead>
            <TableHead className="text-right">入金金額</TableHead>
            <TableHead>照合ステータス</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.length > 0 ? (
            results.map((result) => (
              <TableRow key={result.documentId}>
                <TableCell>{result.documentNumber}</TableCell>
                <TableCell>{result.clientName}</TableCell>
                <TableCell className="text-right">{formatAmount(result.invoiceAmount)}</TableCell>
                <TableCell className="text-right">{formatAmount(result.transferAmount)}</TableCell>
                <TableCell>
                  <Badge variant={MATCH_STATUS_VARIANTS[result.matchStatus]}>
                    {MATCH_STATUS_LABELS[result.matchStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="success"
                    disabled={
                      confirming.has(result.documentId) ||
                      (result.needsManualReview && result.matchStatus !== 'full')
                    }
                    onClick={() => handleConfirm(result)}
                  >
                    {confirming.has(result.documentId) ? '処理中...' : '入金確定'}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10" style={{ color: '#9098a8' }}>
                照合対象の入金データがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
