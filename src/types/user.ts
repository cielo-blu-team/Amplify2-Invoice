// ユーザーロール
export type Role = 'user' | 'accountant' | 'admin';

// 通知種別
export type NotificationType =
  | 'approval_request'
  | 'approval_result'
  | 'payment_result'
  | 'payment_alert_7d'
  | 'payment_alert_3d'
  | 'payment_alert_today'
  | 'overdue'
  | 'document_created';

// 通知設定
export type NotificationSettings = Record<NotificationType, boolean>;

// ユーザー（Users テーブル）
export interface User {
  PK: string; // USER#{userId}
  SK: 'META';
  userId: string;
  cognitoSub: string;
  email: string;
  displayName: string;
  role: Role;
  slackUserId?: string;
  notificationSettings: NotificationSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ユーザー作成入力
export interface UserCreateInput {
  email: string;
  displayName: string;
  role: Role;
}

// デフォルト通知設定（全オン）
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  approval_request: true,
  approval_result: true,
  payment_result: true,
  payment_alert_7d: true,
  payment_alert_3d: true,
  payment_alert_today: true,
  overdue: true,
  document_created: true,
};
