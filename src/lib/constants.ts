// テーブル名
export const TABLE_NAMES = {
  DOCUMENTS: 'Documents',
  CLIENTS: 'Clients',
  SETTINGS: 'Settings',
  USERS: 'Users',
  AUDIT_LOGS: 'AuditLogs',
  SEQUENCES: 'Sequences',
  IDEMPOTENCY_KEYS: 'IdempotencyKeys',
} as const;

// PK プレフィックス
export const PK_PREFIX = {
  DOCUMENT: 'DOC#',
  CLIENT: 'CLIENT#',
  SETTING: 'SETTING#',
  USER: 'USER#',
  LOG: 'LOG#',
  SEQUENCE: 'SEQ#',
  IDEMPOTENCY: 'IDEM#',
} as const;

// SK プレフィックス
export const SK = {
  META: 'META' as const,
  ITEM_PREFIX: 'ITEM#',
  APPROVAL_PREFIX: 'APPROVAL#',
};

// 帳票番号プレフィックス
export const DOCUMENT_NUMBER_PREFIX = {
  estimate: 'EST',
  invoice: 'INV',
} as const;

// GSI名
export const GSI_NAMES = {
  CLIENT_ID: 'GSI-ClientId',
  STATUS: 'GSI-Status',
  CREATED_BY: 'GSI-CreatedBy',
  DOCUMENT_TYPE: 'GSI-DocumentType',
  DOCUMENT_NUMBER: 'GSI-DocumentNumber',
  CLIENT_NAME: 'GSI-ClientName',
} as const;

// ページネーション
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MIN_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

// GCS パス（Cloud Storage）
export const GCS_PATHS = {
  DOCUMENTS: 'documents',
  IMAGES: 'images',
  ARCHIVES: 'archives',
} as const;

// Firestore コレクション名（DynamoDB TABLE_NAMES 相当）
export const COLLECTIONS = {
  DOCUMENTS: 'documents',
  CLIENTS: 'clients',
  SETTINGS: 'settings',
  USERS: 'users',
  AUDIT_LOGS: 'auditLogs',
  SEQUENCES: 'sequences',
  IDEMPOTENCY_KEYS: 'idempotencyKeys',
  PROJECTS: 'projects',
} as const;

// Firestore サブコレクション名
export const SUBCOLLECTIONS = {
  LINE_ITEMS: 'lineItems',
  APPROVALS: 'approvals',
} as const;

// ステータス遷移マップ（設計書 7.1.1）
export const STATUS_TRANSITIONS = {
  draft: ['pending_approval'],
  pending_approval: ['approved', 'rejected'],
  approved: ['confirmed'],
  confirmed: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  paid: [],
  overdue: ['paid', 'cancelled'],
  cancelled: [],
  rejected: ['draft'],
} as const;

// 都道府県リスト
export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;
