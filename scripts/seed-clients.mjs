/**
 * 取引先マスタ シードスクリプト
 * Notionの会社マスタ（16社）をDynamoDB Clientsテーブルに登録する
 *
 * 実行方法:
 *   node scripts/seed-clients.mjs
 *
 * 事前条件:
 *   - AWS認証情報が設定済みであること（DynamoDB CreateTable / PutItem 権限が必要）
 *   - 環境変数 AWS_REGION が設定済みであること（デフォルト: ap-northeast-1）
 */

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const REGION = process.env.AWS_REGION ?? 'ap-northeast-1';
const TABLE = process.env.DYNAMODB_TABLE_CLIENTS ?? 'Clients';

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// Notionから取得した会社マスタ（16社）
const companies = [
  { clientName: 'WEAVE株式会社',           contactPerson: 'ちゅる',    notionCode: 'hs' },
  { clientName: '株式会社プランドゥ',       contactPerson: '岸本',      notionCode: 'pd' },
  { clientName: "合同会社M's Factory",      contactPerson: 'まさひこ',  notionCode: 'mf' },
  { clientName: '合同会社アシスト',         contactPerson: '中嶋',      notionCode: 'as' },
  { clientName: 'カレイジ株式会社',         contactPerson: 'しげや',    notionCode: 'cr' },
  { clientName: 'Cieloblu',               contactPerson: 'しげや',    notionCode: 'cb' },
  { clientName: '株式会社タンゴジャパン',   contactPerson: '三石',      notionCode: 'tj' },
  { clientName: '株式会社LOGEX',           contactPerson: '渡辺大輔',  notionCode: 'lg' },
  { clientName: '株式会社GET',             contactPerson: '前田',      notionCode: 'gm' },
  { clientName: '株式会社Laffey',          contactPerson: 'ねぎりん',  notionCode: 'lf' },
  { clientName: '株式会社Ensu',            contactPerson: '深井',      notionCode: 'es' },
  { clientName: '株式会社Focus',           contactPerson: '辻',        notionCode: 'fc' },
  { clientName: '槌屋商事株式会社',        contactPerson: 'つっちー',  notionCode: 'ts' },
  { clientName: 'IMソリューション株式会社', contactPerson: '伊勢',      notionCode: 'im' },
  { clientName: '株式会社MKH',             contactPerson: 'もりもとら', notionCode: 'mk' },
  { clientName: '株式会社フロントプロダクト', contactPerson: 'さき',    notionCode: 'fp' },
];

function getBusinessType(name) {
  if (name.includes('株式会社') || name.includes('合同会社') || name.includes('有限会社')) {
    return 'corporation';
  }
  return 'other';
}

async function ensureTableExists() {
  try {
    await ddbClient.send(new DescribeTableCommand({ TableName: TABLE }));
    console.log(`✓ テーブル "${TABLE}" は既に存在します`);
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`テーブル "${TABLE}" を作成中...`);
      await ddbClient.send(new CreateTableCommand({
        TableName: TABLE,
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
          { AttributeName: 'clientNameKana', AttributeType: 'S' },
          { AttributeName: 'clientName', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI-ClientName',
            KeySchema: [
              { AttributeName: 'clientNameKana', KeyType: 'HASH' },
              { AttributeName: 'clientName', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));

      // テーブルがACTIVEになるまで待機
      console.log('テーブルがACTIVEになるまで待機中...');
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res = await ddbClient.send(new DescribeTableCommand({ TableName: TABLE }));
        if (res.Table.TableStatus === 'ACTIVE') {
          console.log(`✓ テーブル "${TABLE}" を作成しました`);
          return;
        }
      }
      throw new Error('テーブルのACTIVE化タイムアウト');
    }
    throw err;
  }
}

async function insertClient(company) {
  const clientId = randomUUID();
  const now = new Date().toISOString();

  const item = {
    PK: `CLIENT#${clientId}`,
    SK: 'META',
    clientId,
    clientName: company.clientName,
    businessType: getBusinessType(company.clientName),
    contactPerson: company.contactPerson,
    notes: `Notionコード: ${company.notionCode}`,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: item,
    ConditionExpression: 'attribute_not_exists(PK)',
  }));

  return clientId;
}

async function main() {
  console.log('=== 取引先マスタ シード開始 ===');
  console.log(`リージョン: ${REGION}`);
  console.log(`テーブル: ${TABLE}`);
  console.log('');

  await ensureTableExists();
  console.log('');

  let success = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      const clientId = await insertClient(company);
      console.log(`✓ ${company.clientName} (${company.notionCode}) → clientId: ${clientId}`);
      success++;
    } catch (err) {
      console.error(`✗ ${company.clientName}: ${err.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`=== 完了: 成功 ${success}件 / 失敗 ${failed}件 ===`);
}

main().catch(err => {
  console.error('エラー:', err);
  process.exit(1);
});
