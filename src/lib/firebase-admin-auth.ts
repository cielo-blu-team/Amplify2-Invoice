/**
 * Firebase Admin Auth ユーティリティ
 * Cognito 管理 SDK（src/lib/cognito.ts）の置き換え
 * 同一の関数シグネチャを維持
 */
import { getAdminAuth } from './firebase-admin';
import type { Role } from '@/types/user';

export async function getUser(uid: string) {
  return getAdminAuth().getUser(uid);
}

export async function getUserByEmail(email: string) {
  return getAdminAuth().getUserByEmail(email);
}

export async function listUsers(maxResults = 60) {
  const result = await getAdminAuth().listUsers(maxResults);
  return result.users;
}

/**
 * ユーザー作成
 * Cognito AdminCreateUser 相当
 * suppressInviteEmail: true の場合はパスワードリセットメールを送らない
 */
export async function createUser(
  email: string,
  displayName: string,
  role: Role,
  suppressInviteEmail = false,
) {
  const auth = getAdminAuth();

  const user = await auth.createUser({
    email,
    displayName,
    emailVerified: true,
  });

  // カスタムクレームで role を設定（Cognito custom:role 相当）
  await auth.setCustomUserClaims(user.uid, { role });

  if (!suppressInviteEmail) {
    // パスワード設定リンクを生成してメール送信（発信者側で処理）
    // 呼び出し元が notificationService 等を通じて Slack 等で通知する
  }

  return user;
}

/**
 * 一時パスワード設定
 * Cognito AdminSetUserPassword 相当
 * Firebase Auth Admin SDK は直接パスワードを設定できるため REST API 不要
 */
export async function setTemporaryPassword(
  uid: string,
  temporaryPassword: string,
  _permanent = false,
) {
  await getAdminAuth().updateUser(uid, { password: temporaryPassword });
}

/**
 * パスワードリセットリンク生成
 * Cognito AdminResetUserPassword 相当
 * 生成したリンクを呼び出し元で Slack 通知等に利用する
 */
export async function generatePasswordResetLink(email: string): Promise<string> {
  return getAdminAuth().generatePasswordResetLink(email);
}

/**
 * ユーザー無効化
 * Cognito AdminDisableUser 相当
 */
export async function disableUser(uid: string) {
  await getAdminAuth().updateUser(uid, { disabled: true });
}

/**
 * カスタムクレームの更新（role / department）
 * Cognito custom:role 属性の更新相当
 */
export async function updateUserClaims(
  uid: string,
  claims: { role?: Role; department?: string },
) {
  const auth = getAdminAuth();
  const user = await auth.getUser(uid);
  const existing = user.customClaims ?? {};
  await auth.setCustomUserClaims(uid, { ...existing, ...claims });
}

/**
 * ID トークン検証
 * Cognito JWT 検証の代替
 */
export async function verifyIdToken(idToken: string) {
  return getAdminAuth().verifyIdToken(idToken);
}
