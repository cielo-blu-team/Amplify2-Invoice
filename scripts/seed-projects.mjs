/**
 * 案件マスタ シードスクリプト
 * Notionのプロジェクトマスタ（81件）をDynamoDB Projectsテーブルに登録する
 *
 * 実行方法:
 *   node scripts/seed-projects.mjs
 */

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const REGION = process.env.AWS_REGION ?? 'ap-northeast-1';
const TABLE = process.env.DYNAMODB_TABLE_PROJECTS ?? 'Projects';

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// Notion会社ID → { clientId, clientName } マッピング（seed-clients.mjs 実行結果より）
const companyMap = {
  '5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10': { clientId: '7c1a131e-3b6b-461b-a54b-9d0bb2466c53', clientName: 'IMソリューション株式会社' },
  '11630dd0-1aaf-80b5-83b7-ed77d0b46616': { clientId: 'c3cc69b8-ac30-4c68-bd58-6579ebe1e049', clientName: 'カレイジ株式会社' },
  'ccf6909e-508f-4955-81d0-b9ff5bdf9ce9': { clientId: '01040905-32c8-4b60-a7e2-f2811d6f8375', clientName: 'WEAVE株式会社' },
  '3f3f0470-9ee3-4123-b81c-5f364fa4780b': { clientId: '9e919f52-58af-4015-acbe-7d20bfd37752', clientName: '槌屋商事株式会社' },
  '2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6': { clientId: 'e9a37dc4-7951-4059-848e-01457e5cecac', clientName: '株式会社プランドゥ' },
  'ef56b1f9-8bd4-4da9-acdd-3239791bdc21': { clientId: '412a1319-3814-46f4-8547-e9e68b702778', clientName: "合同会社M's Factory" },
  '749ec2bf-2f5c-4fbb-a570-f82f66e886bc': { clientId: 'fff39809-a655-4060-8d7c-aa2b385f3d11', clientName: '株式会社フロントプロダクト' },
  '656ebbdd-67fd-43b9-87ba-8a38bcf28f95': { clientId: 'f0d58aee-ba55-4f86-8daa-8f40d8eab8c9', clientName: '株式会社MKH' },
  '3a1c4fbd-c602-4de1-b4ad-1a7c67ae3fe6': { clientId: '80888ba6-36aa-4864-aff5-290b5d58a6c3', clientName: '合同会社アシスト' },
  '1e230dd0-1aaf-80f5-8648-c126e6fc1500': { clientId: 'e7df745a-5a4e-4f4c-80ad-16a64692ce10', clientName: '株式会社タンゴジャパン' },
  '20630dd0-1aaf-8086-b0b2-e92a53ced53f': { clientId: '9829c4ad-8f65-458b-a5a3-bfe66f605f77', clientName: '株式会社LOGEX' },
  '24d30dd0-1aaf-80c4-b0ba-e61dce65ae99': { clientId: '0f9c0796-db15-4cdf-ad43-7b2299044883', clientName: '株式会社GET' },
  '2e230dd0-1aaf-8053-a53e-eff51abac0a6': { clientId: 'c452fb2f-b928-40db-9c2f-b4b411e70a8d', clientName: '株式会社Laffey' },
  '3c10d75b-2816-4b22-ac49-28c272416abf': { clientId: '44907c6c-da37-4830-905f-a4ac3925bbea', clientName: '株式会社Focus' },
};

// Notionステータス → システムステータス
function mapStatus(notionStatus) {
  switch (notionStatus) {
    case '開発中':           return 'in_progress';
    case '保守':             return 'in_progress';
    case '仕様調整中':       return 'planning';
    case '開発済み・リリース前': return 'planning';
    case 'その他':           return 'planning';
    case '保留':             return 'suspended';
    case 'サービス終了':     return 'completed';
    default:                return 'planning';
  }
}

// Notionから取得した81件のプロジェクトデータ
const projects = [
  {"name":"IMソリューション全体管理","status":"その他","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shigeya"]},
  {"name":"間接業務","status":"その他","companies":["11630dd0-1aaf-80b5-83b7-ed77d0b46616"],"managers":["Shigeya"]},
  {"name":"メルセデス","status":"保守","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["yui"]},
  {"name":"ラクテンスコープ","status":"サービス終了","companies":["3f3f0470-9ee3-4123-b81c-5f364fa4780b"],"managers":["Shota Irii"]},
  {"name":"ヤフショスコープ","status":"サービス終了","companies":["3f3f0470-9ee3-4123-b81c-5f364fa4780b"],"managers":["Shota Irii"]},
  {"name":"M&T メーカー＆問屋仕入れ講座","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"MonoTracer","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"D-master Calculator2","status":"保守","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["Shota Irii"]},
  {"name":"検索件数集計スプレッドシート","status":"仕様調整中","companies":["ef56b1f9-8bd4-4da9-acdd-3239791bdc21"],"managers":["Junji Ogawa"]},
  {"name":"Qoo10注文管理システム","status":"保守","companies":["749ec2bf-2f5c-4fbb-a570-f82f66e886bc"],"managers":["Junji Ogawa"]},
  {"name":"納品代行実績ツール","status":"保守","companies":["11630dd0-1aaf-80b5-83b7-ed77d0b46616"],"managers":["Junji Ogawa"]},
  {"name":"楽ラクサーチ","status":"保守","companies":["11630dd0-1aaf-80b5-83b7-ed77d0b46616"],"managers":["Shota Irii"]},
  {"name":"ECセラーのための確定申告講座","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"トレジャースコープ","status":"サービス終了","companies":["3f3f0470-9ee3-4123-b81c-5f364fa4780b"],"managers":["Junji Ogawa"]},
  {"name":"YRプライス","status":"保守","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["yui"]},
  {"name":"サンクスレビュー","status":"保守","companies":["656ebbdd-67fd-43b9-87ba-8a38bcf28f95"],"managers":["Shigeya"]},
  {"name":"Qoo10自動入札ツール","status":"保守","companies":["656ebbdd-67fd-43b9-87ba-8a38bcf28f95"],"managers":["Junji Ogawa"]},
  {"name":"マイルストン拡張機能","status":"サービス終了","companies":["3a1c4fbd-c602-4de1-b4ad-1a7c67ae3fe6"],"managers":["Junji Ogawa"]},
  {"name":"販戦略セミナー決済ページ","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"EXリピートマスター","status":"保留","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["Junji Ogawa"]},
  {"name":"FeeFlex","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"E-Booster","status":"サービス終了","companies":["1e230dd0-1aaf-80f5-8648-c126e6fc1500"],"managers":["Junji Ogawa"]},
  {"name":"ナイトセラー","status":"保守","companies":["656ebbdd-67fd-43b9-87ba-8a38bcf28f95"],"managers":["yui"]},
  {"name":"D-Master-Tool","status":"仕様調整中","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["Shigeya"]},
  {"name":"プレミア商品リスト","status":"保守","companies":["11630dd0-1aaf-80b5-83b7-ed77d0b46616"],"managers":["Junji Ogawa"]},
  {"name":"Shopee拡張機能","status":"開発中","companies":["20630dd0-1aaf-8086-b0b2-e92a53ced53f"],"managers":["Junji Ogawa"]},
  {"name":"モノサイト","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Junji Ogawa"]},
  {"name":"もりもとらメルマガ","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shota Irii"]},
  {"name":"ゆーへーの問屋仕入れメールマガジン","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shota Irii"]},
  {"name":"卸システム","status":"保守","companies":["656ebbdd-67fd-43b9-87ba-8a38bcf28f95"],"managers":["yui"]},
  {"name":"Shopee出荷ツール","status":"開発中","companies":["24d30dd0-1aaf-80c4-b0ba-e61dce65ae99"],"managers":["Shigeya"]},
  {"name":"自社ブラ収支管理システム","status":"仕様調整中","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shigeya"]},
  {"name":"STOCK LINK","status":"保守","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["Junji Ogawa"]},
  {"name":"プライス・D・ミエール","status":"サービス終了","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["Shota Irii"]},
  {"name":"QS for China","status":"開発中","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Junji Ogawa"]},
  {"name":"ヘラクレス","status":"サービス終了","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["yui"]},
  {"name":"アパリサ","status":"保守","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["Shota Irii"]},
  {"name":"QS for eBay","status":"仕様調整中","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shigeya","Junji Ogawa"]},
  {"name":"QuickShop","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shota Irii"]},
  {"name":"無在庫ツール(仮)","status":"開発中","companies":["2e230dd0-1aaf-8053-a53e-eff51abac0a6"],"managers":["Shigeya"]},
  {"name":"D-master Claculator for eBay","status":"仕様調整中","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["Junji Ogawa"]},
  {"name":"Easy Ship PDF変換","status":"開発中","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["Junji Ogawa"]},
  {"name":"D-master Hunting","status":"保守","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["yui"]},
  {"name":"CROSS PRICE","status":"開発中","companies":["656ebbdd-67fd-43b9-87ba-8a38bcf28f95"],"managers":["Shigeya"]},
  {"name":"超・規制解除くん","status":"開発中","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["Shota Irii"]},
  {"name":"NETSEA拡張機能","status":"保留","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"AmaPrice","status":"保留","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shigeya"]},
  {"name":"QuikcShopWEB","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"D-master Calculator","status":"サービス終了","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["Shota Irii"]},
  {"name":"ラクハンター","status":"サービス終了","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["NA"]},
  {"name":"LISTIQ","status":"サービス終了","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["yui"]},
  {"name":"ナイトセールツール","status":"保守","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["yui"]},
  {"name":"Trello（仮）","status":"保守","companies":["3c10d75b-2816-4b22-ac49-28c272416abf"],"managers":["yui"]},
  {"name":"セールスマート","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["NA"]},
  {"name":"セラースコープ","status":"開発中","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"リセプラ","status":"保留","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Junji Ogawa"]},
  {"name":"MonoTracer拡張機能","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Junji Ogawa"]},
  {"name":"PricePivot","status":"保留","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Junji Ogawa"]},
  {"name":"InvoiceCaptures","status":"サービス終了","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["NA"]},
  {"name":"Clister","status":"サービス終了","companies":["ef56b1f9-8bd4-4da9-acdd-3239791bdc21"],"managers":["Junji Ogawa"]},
  {"name":"QS for フリマ","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shota Irii"]},
  {"name":"超リサーチ","status":"保守","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["Shota Irii"]},
  {"name":"R-BANK-WEB","status":"保守","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["yui"]},
  {"name":"E-MASTER Calculator","status":"保守","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["Junji Ogawa"]},
  {"name":"問屋仕入れビジネス解体新書","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"アマレーダー","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"ちゅるAmazon版","status":"保守","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["Shota Irii"]},
  {"name":"K-MasterHunting","status":"保守","companies":["ef56b1f9-8bd4-4da9-acdd-3239791bdc21"],"managers":["yui"]},
  {"name":"FBA納品先小田原固定化ツール","status":"開発中","companies":["656ebbdd-67fd-43b9-87ba-8a38bcf28f95"],"managers":["yui"]},
  {"name":"GetPriceTool","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Junji Ogawa"]},
  {"name":"MSC","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["yui"]},
  {"name":"eBayカメラ出品ツール","status":"保守","companies":["ef56b1f9-8bd4-4da9-acdd-3239791bdc21"],"managers":["Junji Ogawa"]},
  {"name":"QuickShopPro","status":"サービス終了","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shota Irii"]},
  {"name":"超・買取マスター","status":"開発中","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["yui"]},
  {"name":"プレサーチ","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Junji Ogawa"]},
  {"name":"D-masterフリマツール","status":"保守","companies":["2cfe1a2c-1d70-4048-9436-f1c2dc09c9c6"],"managers":["Junji Ogawa"]},
  {"name":"マカ・D・ミエール","status":"サービス終了","companies":["ccf6909e-508f-4955-81d0-b9ff5bdf9ce9"],"managers":["Shota Irii"]},
  {"name":"eBayFinder","status":"保守","companies":["ef56b1f9-8bd4-4da9-acdd-3239791bdc21"],"managers":["Junji Ogawa"]},
  {"name":"ASINFinder","status":"保守","companies":["5dc4ecfb-9ec7-49ba-924f-c7bdd1817a10"],"managers":["Shota Irii"]},
  {"name":"DropeBay","status":"保守","companies":["ef56b1f9-8bd4-4da9-acdd-3239791bdc21"],"managers":["Junji Ogawa"]},
  {"name":"DropeBay拡張機能","status":"保守","companies":["ef56b1f9-8bd4-4da9-acdd-3239791bdc21"],"managers":["Junji Ogawa"]},
];

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
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));

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

async function insertProject(project) {
  const projectId = randomUUID();
  const now = new Date().toISOString();
  const notionCompanyId = project.companies[0];
  const client = notionCompanyId ? companyMap[notionCompanyId] : null;
  const managers = project.managers.filter(m => m && m !== 'NA');

  const item = {
    PK: `PROJECT#${projectId}`,
    SK: 'META',
    projectId,
    projectName: project.name,
    clientId: client?.clientId,
    clientName: client?.clientName,
    status: mapStatus(project.status),
    priority: 'medium',
    assignedTo: managers.length > 0 ? managers.join(', ') : undefined,
    notes: `Notionステータス: ${project.status}`,
    isDeleted: false,
    createdBy: 'seed',
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: item,
    ConditionExpression: 'attribute_not_exists(PK)',
  }));

  return projectId;
}

async function main() {
  console.log('=== 案件マスタ シード開始 ===');
  console.log(`リージョン: ${REGION}`);
  console.log(`テーブル: ${TABLE}`);
  console.log('');

  await ensureTableExists();
  console.log('');

  let success = 0;
  let failed = 0;

  for (const project of projects) {
    try {
      const projectId = await insertProject(project);
      const client = companyMap[project.companies[0]];
      console.log(`✓ ${project.name} [${project.status}→${mapStatus(project.status)}] (${client?.clientName ?? '不明'}) → ${projectId}`);
      success++;
    } catch (err) {
      console.error(`✗ ${project.name}: ${err.message}`);
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
