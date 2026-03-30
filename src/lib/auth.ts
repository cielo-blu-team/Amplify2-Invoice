import type { Role } from '@/types/user';

// アクション定義
export type Action =
  | 'document:create'
  | 'document:read'
  | 'document:update'
  | 'document:delete'
  | 'document:approve'
  | 'document:send'
  | 'document:cancel'
  | 'client:create'
  | 'client:update'
  | 'client:delete'
  | 'settings:read'
  | 'settings:update'
  | 'user:manage'
  | 'audit-log:read';

// ロール別の権限マップ
// user: 帳票作成・閲覧・更新のみ
// accountant: user権限 + 承認・送付・取消・設定変更
// admin: 全権限
export const permissions: Record<Role, Action[]> = {
  user: [
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'client:create',
    'client:update',
    'settings:read',
  ],
  accountant: [
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'document:approve',
    'document:send',
    'document:cancel',
    'client:create',
    'client:update',
    'client:delete',
    'settings:read',
    'settings:update',
    'audit-log:read',
  ],
  admin: [
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'document:approve',
    'document:send',
    'document:cancel',
    'client:create',
    'client:update',
    'client:delete',
    'settings:read',
    'settings:update',
    'user:manage',
    'audit-log:read',
  ],
};

/**
 * ロールが指定アクションの権限を持つか確認する
 */
export function hasPermission(role: Role, action: Action): boolean {
  return permissions[role].includes(action);
}

/**
 * 権限チェックを行い、権限がない場合は Error をスロー
 */
export function authorize(role: Role, action: Action): void {
  if (!hasPermission(role, action)) {
    throw new Error(
      `権限がありません: ロール '${role}' はアクション '${action}' を実行できません`,
    );
  }
}

/**
 * 四眼原則チェック（設計書 6.2）
 * 承認依頼者と承認者は異なるユーザーでなければならない
 */
export function canApprove(requesterId: string, approverId: string): boolean {
  return requesterId !== approverId;
}

/**
 * JWT クレームからロールを取得するユーティリティ
 * Firebase カスタムクレームの 'role' フィールドを参照
 * （旧 Cognito: claims['custom:role'] → Firebase: claims['role']）
 */
export function getRoleFromClaims(claims: Record<string, unknown>): Role {
  const validRoles: Role[] = ['user', 'accountant', 'admin'];
  // Firebase カスタムクレームは直接 'role' フィールドに格納
  const claimRole = claims['role'];
  if (typeof claimRole === 'string' && (validRoles as string[]).includes(claimRole)) {
    return claimRole as Role;
  }
  return 'user';
}
