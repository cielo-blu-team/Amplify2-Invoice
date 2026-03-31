'use server';

import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth';
import { getCurrentUserRole } from '@/lib/auth-server';
import * as userRepo from '@/repositories/user.repository';
import { updateUserClaims } from '@/lib/firebase-admin-auth';
import type { Role } from '@/types';

export async function listUsersAction() {
  const role = await getCurrentUserRole();
  authorize(role, 'user:manage');
  return userRepo.listUsers();
}

export async function updateUserRoleAction(userId: string, newRole: Role) {
  const role = await getCurrentUserRole();
  authorize(role, 'user:manage');

  const user = await userRepo.getUserById(userId);
  if (!user) throw new Error('ユーザーが見つかりません');

  // Firestore 更新
  await userRepo.updateUser(userId, { role: newRole });

  // Firebase カスタムクレーム更新
  const firebaseUid = user.cognitoSub;
  if (firebaseUid) {
    await updateUserClaims(firebaseUid, { role: newRole });
  }

  revalidatePath('/settings/users');
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const role = await getCurrentUserRole();
  authorize(role, 'user:manage');

  await userRepo.updateUser(userId, { isActive: false });
  revalidatePath('/settings/users');
  return { success: true };
}
