export const dynamic = 'force-dynamic';

import { getDocuments } from '@/queries/document';
import { getCurrentUserId, getCurrentUserDisplayName } from '@/lib/auth-server';
import ApprovalListClient from './ApprovalListClient';

export default async function ApprovalsPage() {
  const [result, approverId, approverName] = await Promise.all([
    getDocuments({ status: ['pending_approval'], limit: 50 }).catch(() => ({
      items: [],
      nextCursor: undefined,
    })),
    getCurrentUserId(),
    getCurrentUserDisplayName(),
  ]);
  return <ApprovalListClient initialData={result} approverId={approverId} approverName={approverName} />;
}
