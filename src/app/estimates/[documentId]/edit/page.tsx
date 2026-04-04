export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { getDocumentWithLineItems } from '@/queries/document';
import { getCurrentUserId } from '@/lib/auth-server';
import EditEstimateClient from './EditEstimateClient';

interface Props {
  params: Promise<{ documentId: string }>;
}

export default async function EditEstimatePage({ params }: Props) {
  const { documentId } = await params;
  const [result, userId] = await Promise.all([
    getDocumentWithLineItems(documentId).catch(() => null),
    getCurrentUserId(),
  ]);

  if (!result) notFound();
  if (result.header.status !== 'draft') {
    redirect(`/estimates/${documentId}`);
  }

  return (
    <EditEstimateClient
      document={result.header}
      lineItems={result.lineItems}
      userId={userId}
    />
  );
}
