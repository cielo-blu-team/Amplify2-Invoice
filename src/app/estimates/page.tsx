export const dynamic = 'force-dynamic';

import { getDocuments } from '@/queries/document';
import EstimateListClient from './EstimateListClient';

export default async function EstimatesPage() {
  const result = await getDocuments({ documentType: 'estimate', limit: 20 }).catch(() => ({ items: [], nextCursor: undefined }));
  return <EstimateListClient initialData={result} />;
}
