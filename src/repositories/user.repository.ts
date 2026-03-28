import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type { User, Role } from '@/types';
import { getDynamoDocumentClient } from './_dynamo-client';

const TABLE = process.env.DYNAMODB_TABLE_USERS ?? 'Users';

// ユーザー取得
export async function getUserById(userId: string): Promise<User | null> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new GetCommand({
      TableName: TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: 'META',
      },
    })
  );
  return (result.Item as User) ?? null;
}

// Cognito Sub でユーザー取得（GSI-CognitoSub）
export async function getUserByCognitoSub(cognitoSub: string): Promise<User | null> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI-CognitoSub',
      KeyConditionExpression: '#cognitoSub = :cognitoSub',
      ExpressionAttributeNames: {
        '#cognitoSub': 'cognitoSub',
      },
      ExpressionAttributeValues: {
        ':cognitoSub': cognitoSub,
      },
      Limit: 1,
    })
  );
  const items = result.Items as User[];
  return items.length > 0 ? items[0] : null;
}

// ユーザー作成
export async function createUser(user: User): Promise<void> {
  const client = getDynamoDocumentClient();
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  );
}

// ユーザー更新
export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  const client = getDynamoDocumentClient();
  const now = new Date().toISOString();

  const fieldsToUpdate = { ...updates, updatedAt: now };

  // PK, SK は更新不可なので除外
  const { PK: _PK, SK: _SK, ...safeUpdates } = fieldsToUpdate as Partial<User> & {
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
        PK: `USER#${userId}`,
        SK: 'META',
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

// ユーザー一覧
export async function listUsers(): Promise<User[]> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: '#SK = :skMeta',
      ExpressionAttributeNames: {
        '#SK': 'SK',
      },
      ExpressionAttributeValues: {
        ':skMeta': 'META',
      },
    })
  );
  return (result.Items as User[]) ?? [];
}

// ロールでユーザー一覧（GSI-Role）
export async function listUsersByRole(role: Role): Promise<User[]> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI-Role',
      KeyConditionExpression: '#role = :role',
      ExpressionAttributeNames: {
        '#role': 'role',
      },
      ExpressionAttributeValues: {
        ':role': role,
      },
    })
  );
  return (result.Items as User[]) ?? [];
}
