export const dynamic = 'force-dynamic';

import { getCurrentUserRole } from '@/lib/auth-server';
import { hasPermission } from '@/lib/auth';
import * as userRepo from '@/repositories/user.repository';
import * as invitationRepo from '@/repositories/invitation.repository';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const role = await getCurrentUserRole();

  if (!hasPermission(role, 'user:manage')) {
    return (
      <div className="p-8 text-center text-zinc-500">
        この画面を表示する権限がありません
      </div>
    );
  }

  const [users, invitations] = await Promise.all([
    userRepo.listUsers().catch(() => []),
    invitationRepo.listInvitations().catch(() => []),
  ]);

  return <UsersClient users={users} invitations={invitations} />;
}
