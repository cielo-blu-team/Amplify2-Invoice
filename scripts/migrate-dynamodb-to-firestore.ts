/**
 * DynamoDB → Firestore データ移行スクリプト（一回限り実行）
 *
 * 使用方法:
 *   1. 環境変数を設定:
 *      export AWS_REGION=ap-northeast-1
 *      export AWS_ACCESS_KEY_ID=xxx
 *      export AWS_SECRET_ACCESS_KEY=xxx
 *      export GCP_PROJECT_ID=your-project
 *      export GOOGLE_APPLICATION_CREDENTIALS=path/to/sa-key.json
 *   2. 実行:
 *      pnpm exec tsx scripts/migrate-dynamodb-to-firestore.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const DYNAMODB_TABLES = {
  DOCUMENTS: process.env.DYNAMODB_TABLE_DOCUMENTS ?? 'Documents',
  CLIENTS: process.env.DYNAMODB_TABLE_CLIENTS ?? 'Clients',
  SETTINGS: process.env.DYNAMODB_TABLE_SETTINGS ?? 'Settings',
  USERS: process.env.DYNAMODB_TABLE_USERS ?? 'Users',
  AUDIT_LOGS: process.env.DYNAMODB_TABLE_AUDIT_LOGS ?? 'AuditLogs',
  SEQUENCES: process.env.DYNAMODB_TABLE_SEQUENCES ?? 'Sequences',
  PROJECTS: process.env.DYNAMODB_TABLE_PROJECTS ?? 'Projects',
};

const COLLECTIONS = {
  DOCUMENTS: 'documents',
  CLIENTS: 'clients',
  SETTINGS: 'settings',
  USERS: 'users',
  AUDIT_LOGS: 'auditLogs',
  SEQUENCES: 'sequences',
  PROJECTS: 'projects',
};

async function main() {
  const ddbClient = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.AWS_REGION ?? 'ap-northeast-1' })
  );

  initializeApp({ projectId: process.env.GCP_PROJECT_ID });
  const db = getFirestore();

  console.log('=== DynamoDB → Firestore 移行開始 ===');

  // --- Clients ---
  await migrateClients(ddbClient, db);

  // --- Settings ---
  await migrateSettings(ddbClient, db);

  // --- Users ---
  await migrateUsers(ddbClient, db);

  // --- Sequences ---
  await migrateSequences(ddbClient, db);

  // --- Documents + LineItems + Approvals ---
  await migrateDocuments(ddbClient, db);

  // --- AuditLogs ---
  await migrateAuditLogs(ddbClient, db);

  // --- Projects ---
  await migrateProjects(ddbClient, db);

  console.log('=== 移行完了 ===');
}

async function scanAll(
  client: DynamoDBDocumentClient,
  tableName: string
): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await client.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...((result.Items as Record<string, unknown>[]) ?? []));
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    console.log(`  ${tableName}: ${items.length}件取得中...`);
  } while (lastKey);

  return items;
}

async function migrateClients(
  ddb: DynamoDBDocumentClient,
  db: FirebaseFirestore.Firestore
) {
  console.log('\n[Clients] 移行中...');
  const items = await scanAll(ddb, DYNAMODB_TABLES.CLIENTS);
  const metaItems = items.filter((i) => i['SK'] === 'META');

  const batch = db.batch();
  let count = 0;

  for (const item of metaItems) {
    const clientId = (item['clientId'] as string) ??
      (item['PK'] as string)?.replace('CLIENT#', '');
    if (!clientId) continue;

    const { PK: _PK, SK: _SK, ...data } = item;
    batch.set(db.collection(COLLECTIONS.CLIENTS).doc(clientId), data);
    count++;

    if (count % 499 === 0) {
      await batch.commit();
    }
  }

  await batch.commit();
  console.log(`[Clients] ${count}件移行完了`);
}

async function migrateSettings(
  ddb: DynamoDBDocumentClient,
  db: FirebaseFirestore.Firestore
) {
  console.log('\n[Settings] 移行中...');
  const items = await scanAll(ddb, DYNAMODB_TABLES.SETTINGS);

  for (const item of items) {
    if (item['PK'] === 'SETTING#company' && item['SK'] === 'META') {
      const { PK: _PK, SK: _SK, ...data } = item;
      await db.collection(COLLECTIONS.SETTINGS).doc('company').set(data);
      console.log('[Settings] company 設定を移行完了');
    }
  }
}

async function migrateUsers(
  ddb: DynamoDBDocumentClient,
  db: FirebaseFirestore.Firestore
) {
  console.log('\n[Users] 移行中...');
  const items = await scanAll(ddb, DYNAMODB_TABLES.USERS);
  const metaItems = items.filter((i) => i['SK'] === 'META');

  const batch = db.batch();
  let count = 0;

  for (const item of metaItems) {
    const userId = (item['userId'] as string) ??
      (item['PK'] as string)?.replace('USER#', '');
    if (!userId) continue;

    // cognitoSub → firebaseUid リネーム
    const { PK: _PK, SK: _SK, cognitoSub, ...rest } = item;
    const data = cognitoSub
      ? { ...rest, firebaseUid: cognitoSub }
      : rest;

    batch.set(db.collection(COLLECTIONS.USERS).doc(userId), data);
    count++;
  }

  await batch.commit();
  console.log(`[Users] ${count}件移行完了`);
}

async function migrateSequences(
  ddb: DynamoDBDocumentClient,
  db: FirebaseFirestore.Firestore
) {
  console.log('\n[Sequences] 移行中...');
  const items = await scanAll(ddb, DYNAMODB_TABLES.SEQUENCES);

  const batch = db.batch();
  let count = 0;

  for (const item of items) {
    const pk = item['PK'] as string;
    if (!pk?.startsWith('SEQ#')) continue;

    // SEQ#{type}#{date} → {type}_{date}
    const docId = pk.replace('SEQ#', '').replace('#', '_');
    const { PK: _PK, SK: _SK, ...data } = item;
    batch.set(db.collection(COLLECTIONS.SEQUENCES).doc(docId), data);
    count++;
  }

  await batch.commit();
  console.log(`[Sequences] ${count}件移行完了`);
}

async function migrateDocuments(
  ddb: DynamoDBDocumentClient,
  db: FirebaseFirestore.Firestore
) {
  console.log('\n[Documents] 移行中...');
  const items = await scanAll(ddb, DYNAMODB_TABLES.DOCUMENTS);

  const headers = items.filter((i) => i['SK'] === 'META');
  const lineItems = items.filter(
    (i) => typeof i['SK'] === 'string' && (i['SK'] as string).startsWith('ITEM#')
  );
  const approvals = items.filter(
    (i) => typeof i['SK'] === 'string' && (i['SK'] as string).startsWith('APPROVAL#')
  );

  let headerCount = 0;
  const BATCH_SIZE = 200;

  for (let i = 0; i < headers.length; i += BATCH_SIZE) {
    const batchItems = headers.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const item of batchItems) {
      const documentId = (item['documentId'] as string) ??
        (item['PK'] as string)?.replace('DOC#', '');
      if (!documentId) continue;

      const { PK: _PK, SK: _SK, ...data } = item;
      const docRef = db.collection(COLLECTIONS.DOCUMENTS).doc(documentId);
      batch.set(docRef, data);
      headerCount++;

      // 明細行を同バッチに含める（Firestore は 500 操作/バッチ）
      const docLineItems = lineItems.filter(
        (li) => li['PK'] === `DOC#${documentId}`
      );
      for (const li of docLineItems) {
        const lineItemId = (li['SK'] as string).replace('ITEM#', '');
        const { PK: _lPK, SK: _lSK, ...liData } = li;
        batch.set(docRef.collection('lineItems').doc(lineItemId), liData);
      }

      // 承認履歴
      const docApprovals = approvals.filter(
        (ap) => ap['PK'] === `DOC#${documentId}`
      );
      for (const ap of docApprovals) {
        const timestamp = (ap['SK'] as string).replace('APPROVAL#', '');
        const { PK: _aPK, SK: _aSK, ...apData } = ap;
        batch.set(docRef.collection('approvals').doc(timestamp), apData);
      }
    }

    await batch.commit();
    console.log(`  [Documents] ${headerCount}/${headers.length}件移行...`);
  }

  console.log(`[Documents] ${headerCount}件移行完了`);
}

async function migrateAuditLogs(
  ddb: DynamoDBDocumentClient,
  db: FirebaseFirestore.Firestore
) {
  console.log('\n[AuditLogs] 移行中...');
  const items = await scanAll(ddb, DYNAMODB_TABLES.AUDIT_LOGS);
  const sevenYears = 7 * 365 * 24 * 60 * 60 * 1000;

  const BATCH_SIZE = 499;
  let count = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = db.batch();

    for (const item of items.slice(i, i + BATCH_SIZE)) {
      const { PK: _PK, SK: _SK, ttl, ...data } = item;
      const date = typeof data['timestamp'] === 'string'
        ? (data['timestamp'] as string).substring(0, 10).replace(/-/g, '')
        : '';

      const ref = db.collection(COLLECTIONS.AUDIT_LOGS).doc();
      batch.set(ref, {
        ...data,
        date,
        expiresAt: Timestamp.fromMillis(Date.now() + sevenYears),
      });
      count++;
    }

    await batch.commit();
    console.log(`  [AuditLogs] ${count}/${items.length}件移行...`);
  }

  console.log(`[AuditLogs] ${count}件移行完了`);
}

async function migrateProjects(
  ddb: DynamoDBDocumentClient,
  db: FirebaseFirestore.Firestore
) {
  console.log('\n[Projects] 移行中...');
  const items = await scanAll(ddb, DYNAMODB_TABLES.PROJECTS);
  const metaItems = items.filter((i) => i['SK'] === 'META');

  const batch = db.batch();
  let count = 0;

  for (const item of metaItems) {
    const projectId = (item['projectId'] as string) ??
      (item['PK'] as string)?.replace('PROJECT#', '');
    if (!projectId) continue;

    const { PK: _PK, SK: _SK, ...data } = item;
    batch.set(db.collection(COLLECTIONS.PROJECTS).doc(projectId), data);
    count++;
  }

  await batch.commit();
  console.log(`[Projects] ${count}件移行完了`);
}

main().catch((e) => {
  console.error('移行エラー:', e);
  process.exit(1);
});
