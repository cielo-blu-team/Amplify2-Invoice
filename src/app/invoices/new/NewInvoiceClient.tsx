'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { createDocument } from '@/actions/document';
import DocumentForm, { type DocumentFormData } from '@/components/documents/DocumentForm';
import { showSuccess, showError } from '@/lib/toast';

interface Props {
  userId: string;
}

export default function NewInvoiceClient({ userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: DocumentFormData) => {
    setLoading(true);
    try {
      const result = await createDocument({
        documentType: 'invoice',
        clientId: data.clientId,
        clientName: data.clientName,
        subject: data.subject,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes,
        items: data.items,
        createdBy: userId,
      });

      if (!result.success) {
        showError(result.error?.message ?? '作成に失敗しました');
        return;
      }

      showSuccess('請求書を作成しました');
      router.push(`/invoices/${result.data!.documentId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: '#0f0f1a' }}>請求書 新規作成</h2>
      <Card>
        <CardContent className="p-6">
          <DocumentForm
            documentType="invoice"
            onSubmit={handleSubmit}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
