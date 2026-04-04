'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { updateDocument } from '@/actions/document';
import DocumentForm, { type DocumentFormData } from '@/components/documents/DocumentForm';
import { showSuccess, showError } from '@/lib/toast';
import type { DocumentHeader, LineItem } from '@/types';

interface Props {
  document: DocumentHeader;
  lineItems: LineItem[];
  userId: string;
}

export default function EditEstimateClient({ document: doc, lineItems }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const initialData: Partial<DocumentFormData> = {
    clientId: doc.clientId,
    clientName: doc.clientName,
    subject: doc.subject,
    issueDate: doc.issueDate,
    validUntil: doc.validUntil,
    notes: doc.notes,
    items: lineItems.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
  };

  const handleSubmit = async (data: DocumentFormData) => {
    setLoading(true);
    try {
      const result = await updateDocument(doc.documentId, {
        clientId: data.clientId,
        clientName: data.clientName,
        subject: data.subject,
        issueDate: data.issueDate,
        validUntil: data.validUntil,
        notes: data.notes,
        items: data.items,
      });

      if (!result.success) {
        showError(result.error?.message ?? '更新に失敗しました');
        return;
      }

      showSuccess('見積書を更新しました');
      router.push(`/estimates/${doc.documentId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <Link
          href={`/estimates/${doc.documentId}`}
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: '#9098a8' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0f0f1a')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9098a8')}
        >
          <ArrowLeft className="h-4 w-4" />
          見積書詳細に戻る
        </Link>
      </div>
      <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>
        見積書 編集 — {doc.documentNumber}
      </h2>
      <Card>
        <CardContent className="p-6">
          <DocumentForm
            documentType="estimate"
            initialData={initialData}
            onSubmit={handleSubmit}
            loading={loading}
            title="見積書編集"
          />
        </CardContent>
      </Card>
    </div>
  );
}
