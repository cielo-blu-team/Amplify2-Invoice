import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { AuditLog } from '@/types';
import { getDynamoDocumentClient, encodeCursor, decodeCursor } from './_dynamo-client';

const TABLE = process.env.DYNAMODB_TABLE_AUDIT_LOGS ?? 'AuditLogs';

// 監査ログ追記
export async function appendAuditLog(log: AuditLog): Promise<void> {
  const client = getDynamoDocumentClient();
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: log,
    })
  );
}

// 監査ログ検索
export async function queryAuditLogs(params: {
  userId?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: AuditLog[]; cursor?: string }> {
  const client = getDynamoDocumentClient();
  const pageSize = params.limit ?? 50;

  // dateFrom/dateTo を PK（LOG#{date}）の検索に使用
  // 日付範囲がある場合、複数日付にまたがるケースは呼び出し元で複数回呼ぶことを前提とし、
  // ここでは dateFrom を基準日として単一クエリ実装
  const dateKey = params.dateFrom
    ? params.dateFrom.substring(0, 10).replace(/-/g, '')
    : new Date().toISOString().substring(0, 10).replace(/-/g, '');

  const filterExpressionParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {
    ':pk': `LOG#${dateKey}`,
  };

  if (params.dateTo) {
    // SK の prefix は timestamp 始まり: {timestamp}#{eventId}
    // dateTo は YYYY-MM-DD 形式を ISO 文字列に変換して範囲フィルタ
    filterExpressionParts.push('#timestamp <= :dateTo');
    expressionAttributeNames['#timestamp'] = 'timestamp';
    expressionAttributeValues[':dateTo'] = `${params.dateTo}T23:59:59.999Z`;
  }

  if (params.userId) {
    filterExpressionParts.push('#userId = :userId');
    expressionAttributeNames['#userId'] = 'userId';
    expressionAttributeValues[':userId'] = params.userId;
  }

  if (params.resourceId) {
    filterExpressionParts.push('#resourceId = :resourceId');
    expressionAttributeNames['#resourceId'] = 'resourceId';
    expressionAttributeValues[':resourceId'] = params.resourceId;
  }

  const queryParams: ConstructorParameters<typeof QueryCommand>[0] = {
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: expressionAttributeValues,
    Limit: pageSize,
    ScanIndexForward: false, // 新しい順
  };

  if (filterExpressionParts.length > 0) {
    queryParams.FilterExpression = filterExpressionParts.join(' AND ');
    queryParams.ExpressionAttributeNames = expressionAttributeNames;
  }

  if (params.cursor) {
    queryParams.ExclusiveStartKey = decodeCursor(params.cursor) as Record<string, unknown>;
  }

  const result = await client.send(new QueryCommand(queryParams));
  const items = (result.Items as AuditLog[]) ?? [];

  return {
    items,
    cursor: result.LastEvaluatedKey
      ? encodeCursor(result.LastEvaluatedKey as Record<string, unknown>)
      : undefined,
  };
}
