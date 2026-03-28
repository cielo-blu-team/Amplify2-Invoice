export const dynamic = 'force-dynamic';

import { getDocuments } from '@/queries/document';
import InvoiceListClient from './InvoiceListClient';

export default async function InvoicesPage() {
  const result = await getDocuments({ documentType: 'invoice', limit: 20 }).catch(() => ({ items: [], nextCursor: undefined }));
  return <InvoiceListClient initialData={result} />;
}
