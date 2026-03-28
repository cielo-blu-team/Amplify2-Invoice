import { notFound } from 'next/navigation';
import { getDocument } from '@/queries/document';
import InvoiceDetailClient from './InvoiceDetailClient';

interface Props {
  params: Promise<{ documentId: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { documentId } = await params;
  const doc = await getDocument(documentId).catch(() => null);
  if (!doc) notFound();
  return <InvoiceDetailClient document={doc} />;
}
