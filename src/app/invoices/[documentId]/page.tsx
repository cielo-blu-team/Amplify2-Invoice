import { notFound } from 'next/navigation';
import { getDocument } from '@/queries/document';
import { getCurrentUserId, getCurrentUserDisplayName } from '@/lib/auth-server';
import InvoiceDetailClient from './InvoiceDetailClient';

interface Props {
  params: Promise<{ documentId: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { documentId } = await params;
  const [doc, userId, userName] = await Promise.all([
    getDocument(documentId).catch(() => null),
    getCurrentUserId(),
    getCurrentUserDisplayName(),
  ]);
  if (!doc) notFound();
  return <InvoiceDetailClient document={doc} userId={userId} userName={userName} />;
}
