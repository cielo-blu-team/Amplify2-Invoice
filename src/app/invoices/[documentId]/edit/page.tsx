export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { getDocumentWithLineItems } from '@/queries/document';
import { getCurrentUserId } from '@/lib/auth-server';
import EditInvoiceClient from './EditInvoiceClient';

interface Props {
  params: Promise<{ documentId: string }>;
}

export default async function EditInvoicePage({ params }: Props) {
  const { documentId } = await params;
  const [result, userId] = await Promise.all([
    getDocumentWithLineItems(documentId).catch(() => null),
    getCurrentUserId(),
  ]);

  if (!result) notFound();
  if (result.header.status !== 'draft') {
    redirect(`/invoices/${documentId}`);
  }

  return (
    <EditInvoiceClient
      document={result.header}
      lineItems={result.lineItems}
      userId={userId}
    />
  );
}
