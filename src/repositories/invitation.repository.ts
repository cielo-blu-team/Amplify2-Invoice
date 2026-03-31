import type { Invitation, InvitationStatus } from '@/types/invitation';
import { getFirestoreClient } from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

export async function createInvitation(invitation: Invitation): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.INVITATIONS)
    .doc(invitation.id)
    .set(invitation);
}

export async function getInvitationByEmail(email: string): Promise<Invitation | null> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.INVITATIONS)
    .where('email', '==', email)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data() as Invitation;
}

export async function listInvitations(): Promise<Invitation[]> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.INVITATIONS)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => d.data() as Invitation);
}

export async function updateInvitationStatus(
  id: string,
  status: InvitationStatus,
  extra?: { usedAt?: string; usedByUid?: string },
): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.INVITATIONS)
    .doc(id)
    .update({ status, ...extra });
}

export async function deleteInvitation(id: string): Promise<void> {
  await getFirestoreClient().collection(COLLECTIONS.INVITATIONS).doc(id).delete();
}
