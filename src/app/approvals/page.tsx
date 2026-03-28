export const dynamic = 'force-dynamic';

import { getDocuments } from '@/queries/document';
import ApprovalListClient from './ApprovalListClient';

export default async function ApprovalsPage() {
  const result = await getDocuments({
    status: ['pending_approval'],
    limit: 50,
  }).catch(() => ({ items: [], nextCursor: undefined }));
  return <ApprovalListClient initialData={result} />;
}
