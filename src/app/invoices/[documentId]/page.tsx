export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getDocumentWithLineItems } from '@/queries/document';
import { getCompanySettings } from '@/queries/settings';
import { getCurrentUserId, getCurrentUserDisplayName } from '@/lib/auth-server';
import InvoiceDetailClient from './InvoiceDetailClient';

interface Props {
  params: Promise<{ documentId: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { documentId } = await params;
  const [result, settings, userId, userName] = await Promise.all([
    getDocumentWithLineItems(documentId).catch(() => null),
    getCompanySettings().catch(() => null),
    getCurrentUserId(),
    getCurrentUserDisplayName(),
  ]);
  if (!result) notFound();
  return (
    <InvoiceDetailClient
      document={result.header}
      lineItems={result.lineItems}
      settings={settings}
      userId={userId}
      userName={userName}
    />
  );
}
