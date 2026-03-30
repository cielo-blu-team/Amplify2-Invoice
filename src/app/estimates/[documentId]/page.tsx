export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getDocument } from '@/queries/document';
import { getCurrentUserId, getCurrentUserDisplayName } from '@/lib/auth-server';
import EstimateDetailClient from './EstimateDetailClient';

interface Props {
  params: Promise<{ documentId: string }>;
}

export default async function EstimateDetailPage({ params }: Props) {
  const { documentId } = await params;
  const [doc, userId, userName] = await Promise.all([
    getDocument(documentId).catch(() => null),
    getCurrentUserId(),
    getCurrentUserDisplayName(),
  ]);
  if (!doc) notFound();
  return <EstimateDetailClient document={doc} userId={userId} userName={userName} />;
}
