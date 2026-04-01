'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth';
import { getCurrentUserId, getCurrentUserDisplayName, getCurrentUserRole } from '@/lib/auth-server';
import * as invitationRepo from '@/repositories/invitation.repository';
import { sendInvitationEmail, getInvitationUrl } from '@/lib/email';
import type { InvitationCreateInput } from '@/types/invitation';

export async function listInvitations() {
  const role = await getCurrentUserRole();
  authorize(role, 'user:manage');
  return invitationRepo.listInvitations();
}

export async function createInvitation(input: InvitationCreateInput) {
  const role = await getCurrentUserRole();
  authorize(role, 'user:manage');

  const createdBy = await getCurrentUserId();
  const createdByName = await getCurrentUserDisplayName();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const invitation = {
    id: randomUUID(),
    email: input.email.toLowerCase().trim(),
    role: input.role,
    createdBy,
    createdByName,
    createdAt: now.toISOString(),
    expiresAt,
    status: 'pending' as const,
  };

  await invitationRepo.createInvitation(invitation);

  // 招待メールを送信
  const emailResult = await sendInvitationEmail({
    to: invitation.email,
    invitationId: invitation.id,
    inviterName: createdByName,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
  });

  revalidatePath('/settings/users');
  return {
    success: true,
    invitation,
    inviteUrl: getInvitationUrl(invitation.id),
    emailSent: emailResult.ok,
    emailError: emailResult.error,
  };
}

export async function deleteInvitation(id: string) {
  const role = await getCurrentUserRole();
  authorize(role, 'user:manage');
  await invitationRepo.deleteInvitation(id);
  revalidatePath('/settings/users');
  return { success: true };
}
