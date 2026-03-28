import { v4 as uuidv4 } from 'uuid';
import * as userRepo from '@/repositories/user.repository';
import type { User, UserCreateInput, Role, NotificationSettings } from '@/types';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/types/user';

// ユーザー作成
export async function createUser(input: UserCreateInput): Promise<User> {
  const userId = uuidv4();
  const now = new Date().toISOString();

  const userData: User = {
    PK: `USER#${userId}`,
    SK: 'META',
    userId,
    cognitoSub: '', // Cognito 統合時に設定
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await userRepo.createUser(userData);
  return userData;
}

// ユーザー更新
export async function updateUser(
  userId: string,
  updates: { displayName?: string; role?: Role; slackUserId?: string }
): Promise<User> {
  const existing = await userRepo.getUserById(userId);
  if (!existing) {
    throw new Error(`User not found: ${userId}`);
  }

  await userRepo.updateUser(userId, updates);

  const updated = await userRepo.getUserById(userId);
  if (!updated) {
    throw new Error(`User not found after update: ${userId}`);
  }
  return updated;
}

// ユーザー取得
export async function getUser(userId: string): Promise<User | null> {
  return userRepo.getUserById(userId);
}

// Cognito Sub でユーザー取得
export async function getUserByCognitoSub(cognitoSub: string): Promise<User | null> {
  return userRepo.getUserByCognitoSub(cognitoSub);
}

// ユーザー一覧
export async function listUsers(): Promise<User[]> {
  return userRepo.listUsers();
}

// 通知設定更新
export async function updateNotificationSettings(
  userId: string,
  settings: NotificationSettings
): Promise<User> {
  const existing = await userRepo.getUserById(userId);
  if (!existing) {
    throw new Error(`User not found: ${userId}`);
  }

  await userRepo.updateUser(userId, { notificationSettings: settings });

  const updated = await userRepo.getUserById(userId);
  if (!updated) {
    throw new Error(`User not found after update: ${userId}`);
  }
  return updated;
}
