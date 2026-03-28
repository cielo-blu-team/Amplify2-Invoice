// CSVエクスポートユーティリティ
import type { DocumentHeader } from '@/types';

export function documentsToCsv(documents: DocumentHeader[]): string {
  const headers = ['帳票番号', '種別', '取引先', '件名', '発行日', 'ステータス', '小計', '消費税', '合計', '作成日'];
  const rows = documents.map(doc => [
    doc.documentNumber,
    doc.documentType === 'estimate' ? '見積書' : '請求書',
    doc.clientName,
    doc.subject,
    doc.issueDate,
    doc.status,
    doc.subtotal,
    doc.taxAmount,
    doc.totalAmount,
    doc.createdAt,
  ]);
  return [headers, ...rows].map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  // ブラウザのみ（'use client'コンポーネントから呼び出す）
  const bom = '\uFEFF'; // Excel用BOM
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
