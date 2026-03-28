import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type { Client } from '@/types';
import { getDynamoDocumentClient, encodeCursor, decodeCursor } from './_dynamo-client';

const TABLE = process.env.DYNAMODB_TABLE_CLIENTS ?? 'Clients';

// 取引先取得
export async function getClientById(clientId: string): Promise<Client | null> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new GetCommand({
      TableName: TABLE,
      Key: {
        PK: `CLIENT#${clientId}`,
        SK: 'META',
      },
    })
  );
  return (result.Item as Client) ?? null;
}

// 取引先作成
export async function createClient(clientData: Client): Promise<void> {
  const client = getDynamoDocumentClient();
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: clientData,
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  );
}

// 取引先更新
export async function updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
  const client = getDynamoDocumentClient();
  const now = new Date().toISOString();

  const fieldsToUpdate = { ...updates, updatedAt: now };

  // PK, SK は更新不可なので除外
  const { PK: _PK, SK: _SK, ...safeUpdates } = fieldsToUpdate as Partial<Client> & {
    PK?: string;
    SK?: string;
  };

  const updateExpressionParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(safeUpdates)) {
    updateExpressionParts.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = value;
  }

  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: {
        PK: `CLIENT#${clientId}`,
        SK: 'META',
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

// 取引先論理削除
export async function softDeleteClient(clientId: string): Promise<void> {
  const client = getDynamoDocumentClient();
  const now = new Date().toISOString();

  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: {
        PK: `CLIENT#${clientId}`,
        SK: 'META',
      },
      UpdateExpression: 'SET #isDeleted = :true, #updatedAt = :now',
      ExpressionAttributeNames: {
        '#isDeleted': 'isDeleted',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':true': true,
        ':now': now,
      },
    })
  );
}

// カナ検索（GSI-ClientNameKana を使用、またはFilterExpression）
export async function searchClients(
  keyword: string,
  limit?: number,
  cursor?: string
): Promise<{ items: Client[]; cursor?: string }> {
  const client = getDynamoDocumentClient();
  const pageSize = limit ?? 20;

  // GSI-ClientNameKana を使ってカナの前方一致検索を試みる
  // GSIが設定されていない場合はScanにフォールバック
  const params: ConstructorParameters<typeof ScanCommand>[0] = {
    TableName: TABLE,
    FilterExpression:
      '(contains(#clientNameKana, :keyword) OR contains(#clientName, :keyword)) AND #isDeleted = :false',
    ExpressionAttributeNames: {
      '#clientNameKana': 'clientNameKana',
      '#clientName': 'clientName',
      '#isDeleted': 'isDeleted',
    },
    ExpressionAttributeValues: {
      ':keyword': keyword,
      ':false': false,
    },
    Limit: pageSize,
  };

  if (cursor) {
    params.ExclusiveStartKey = decodeCursor(cursor) as Record<string, unknown>;
  }

  const result = await client.send(new ScanCommand(params));
  const items = (result.Items as Client[]) ?? [];

  return {
    items,
    cursor: result.LastEvaluatedKey ? encodeCursor(result.LastEvaluatedKey as Record<string, unknown>) : undefined,
  };
}

// 取引先一覧
export async function listClients(
  limit?: number,
  cursor?: string
): Promise<{ items: Client[]; cursor?: string }> {
  const client = getDynamoDocumentClient();
  const pageSize = limit ?? 20;

  const params: ConstructorParameters<typeof ScanCommand>[0] = {
    TableName: TABLE,
    FilterExpression: '#isDeleted = :false',
    ExpressionAttributeNames: {
      '#isDeleted': 'isDeleted',
    },
    ExpressionAttributeValues: {
      ':false': false,
    },
    Limit: pageSize,
  };

  if (cursor) {
    params.ExclusiveStartKey = decodeCursor(cursor) as Record<string, unknown>;
  }

  const result = await client.send(new ScanCommand(params));
  const items = (result.Items as Client[]) ?? [];

  return {
    items,
    cursor: result.LastEvaluatedKey ? encodeCursor(result.LastEvaluatedKey as Record<string, unknown>) : undefined,
  };
}
