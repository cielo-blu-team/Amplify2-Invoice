import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let client: DynamoDBDocumentClient | null = null;

export function getDynamoDocumentClient(): DynamoDBDocumentClient {
  if (!client) {
    const ddbClient = new DynamoDBClient({
      region: process.env.AWS_REGION ?? 'ap-northeast-1',
    });
    client = DynamoDBDocumentClient.from(ddbClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return client;
}

// カーソルエンコード/デコード（Base64）
export function encodeCursor(lastKey: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(lastKey)).toString('base64');
}

export function decodeCursor(cursor: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
}
