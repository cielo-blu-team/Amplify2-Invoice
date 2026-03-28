import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocumentClient } from './_dynamo-client';

const TABLE = process.env.DYNAMODB_TABLE_IDEMPOTENCY_KEYS ?? 'IdempotencyKeys';

// TTL: 24時間（秒単位 Unix timestamp）
function getTtl(): number {
  return Math.floor(Date.now() / 1000) + 86400;
}

// 冪等キー保存（TTL=24時間）
export async function saveIdempotencyKey(key: string, responseData: unknown): Promise<void> {
  const client = getDynamoDocumentClient();
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `IDEM#${key}`,
        SK: 'META',
        responseData,
        ttl: getTtl(),
        createdAt: new Date().toISOString(),
      },
    })
  );
}

// 冪等キー参照（存在すればキャッシュされたレスポンスを返す）
export async function getIdempotencyKey(
  key: string
): Promise<{ responseData: unknown } | null> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new GetCommand({
      TableName: TABLE,
      Key: {
        PK: `IDEM#${key}`,
        SK: 'META',
      },
    })
  );

  if (!result.Item) return null;

  // TTL が切れている場合は null を返す（DynamoDB は遅延削除のため念のため確認）
  const now = Math.floor(Date.now() / 1000);
  const ttl = result.Item['ttl'] as number | undefined;
  if (ttl !== undefined && ttl < now) return null;

  return { responseData: result.Item['responseData'] };
}
