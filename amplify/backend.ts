import { defineBackend } from '@aws-amplify/backend';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
});

// ============================================================
// 1A-02: DynamoDB テーブル定義（Single Table Design）
// ============================================================
const dataStack = backend.createStack('InvoiceDataStack');

// --- Documents テーブル ---
const documentsTable = new dynamodb.Table(dataStack, 'DocumentsTable', {
  tableName: 'Documents',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
  removalPolicy: RemovalPolicy.RETAIN,
});

// 1A-03: GSI 定義
documentsTable.addGlobalSecondaryIndex({
  indexName: 'GSI-ClientId',
  partitionKey: { name: 'clientId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'issueDate', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});

documentsTable.addGlobalSecondaryIndex({
  indexName: 'GSI-Status',
  partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'issueDate', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});

documentsTable.addGlobalSecondaryIndex({
  indexName: 'GSI-CreatedBy',
  partitionKey: { name: 'createdBy', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});

documentsTable.addGlobalSecondaryIndex({
  indexName: 'GSI-DocumentType',
  partitionKey: { name: 'documentType', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'issueDate', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});

documentsTable.addGlobalSecondaryIndex({
  indexName: 'GSI-DocumentNumber',
  partitionKey: { name: 'documentNumber', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.KEYS_ONLY,
});

// --- Clients テーブル ---
const clientsTable = new dynamodb.Table(dataStack, 'ClientsTable', {
  tableName: 'Clients',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
  removalPolicy: RemovalPolicy.RETAIN,
});

clientsTable.addGlobalSecondaryIndex({
  indexName: 'GSI-ClientName',
  partitionKey: { name: 'clientNameKana', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'clientName', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});

// --- Settings テーブル ---
new dynamodb.Table(dataStack, 'SettingsTable', {
  tableName: 'Settings',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

// --- Users テーブル ---
new dynamodb.Table(dataStack, 'UsersTable', {
  tableName: 'Users',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

// --- AuditLogs テーブル ---
// 1A-05: TTL 設定（7年後の epoch）
const auditLogsTable = new dynamodb.Table(dataStack, 'AuditLogsTable', {
  tableName: 'AuditLogs',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
  timeToLiveAttribute: 'ttl',
  removalPolicy: RemovalPolicy.RETAIN,
});

// --- Sequences テーブル（帳票番号採番）---
new dynamodb.Table(dataStack, 'SequencesTable', {
  tableName: 'Sequences',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

// --- IdempotencyKeys テーブル ---
// 1A-05: TTL 設定（24h 後の epoch）
new dynamodb.Table(dataStack, 'IdempotencyKeysTable', {
  tableName: 'IdempotencyKeys',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
  removalPolicy: RemovalPolicy.DESTROY,
});

// ============================================================
// 1A-04: S3 バケット（電子帳簿保存法対応）
// ============================================================
// Note: Object Lock は本番環境でのみ有効化。
// Amplify Storage のバケットに対して CDK override で設定する。
// Object Lock は新規バケット作成時のみ有効化可能なため、
// 本番デプロイ時に手動設定が必要な場合あり。
const storageStack = backend.createStack('InvoiceStorageStack');

// Archive バケット（Glacier、7年保存）
new s3.Bucket(storageStack, 'ArchiveBucket', {
  versioned: true,
  lifecycleRules: [
    {
      id: 'MoveToGlacier',
      transitions: [
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: { toDays: () => 90 } as any,
        },
      ],
    },
  ],
  removalPolicy: RemovalPolicy.RETAIN,
});

// ============================================================
// Cognito カスタマイズ（セッション・ロック設定）
// ============================================================
// Note: Cognito の高度な設定（ログイン試行制限、
// セッションタイムアウト等）は Amplify Gen2 の
// auth override で設定
