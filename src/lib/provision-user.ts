/**
 * 初回ログイン時のユーザープロビジョニング
 * 招待が存在する場合のみ Firestore ドキュメント + カスタムクレームを作成する
 */
import { randomUUID } from 'crypto';
import { getAdminAuth } from './firebase-admin';
import { getFirestoreClient } from '@/repositories/_firestore-client';
import * as invitationRepo from '@/repositories/invitation.repository';
import { COLLECTIONS } from './constants';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/types/user';

export type ProvisionResult =
  | { status: 'existing' }
  | { status: 'provisioned'; role: string }
  | { status: 'not_invited' };

export async function provisionUser(
  uid: string,
  email: string,
  displayName: string,
): Promise<ProvisionResult> {
  const db = getFirestoreClient();

  // 既存ユーザー確認
  const snap = await db
    .collection(COLLECTIONS.USERS)
    .where('cognitoSub', '==', uid)
    .limit(1)
    .get();

  if (!snap.empty) {
    return { status: 'existing' };
  }

  // 招待確認
  const invitation = await invitationRepo.getInvitationByEmail(email.toLowerCase());
  if (!invitation) {
    return { status: 'not_invited' };
  }

  // 招待の有効期限確認
  if (new Date(invitation.expiresAt) < new Date()) {
    await invitationRepo.updateInvitationStatus(invitation.id, 'expired');
    return { status: 'not_invited' };
  }

  const now = new Date().toISOString();
  const userId = randomUUID();

  // Firestore ユーザードキュメント作成
  await db.collection(COLLECTIONS.USERS).doc(userId).set({
    PK: `USER#${userId}`,
    SK: 'META',
    cognitoSub: uid,
    firebaseUid: uid,
    email,
    displayName: displayName || email,
    role: invitation.role,
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  // Firebase カスタムクレームにロールを設定
  await getAdminAuth().setCustomUserClaims(uid, { role: invitation.role });

  // 招待を使用済みに更新
  await invitationRepo.updateInvitationStatus(invitation.id, 'used', {
    usedAt: now,
    usedByUid: uid,
  });

  return { status: 'provisioned', role: invitation.role };
}
