export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getDocument } from '@/queries/document';
import EstimateDetailClient from './EstimateDetailClient';

interface Props {
  params: Promise<{ documentId: string }>;
}

export default async function EstimateDetailPage({ params }: Props) {
  const { documentId } = await params;
  const doc = await getDocument(documentId).catch(() => null);
  if (!doc) notFound();
  return <EstimateDetailClient document={doc} />;
}
