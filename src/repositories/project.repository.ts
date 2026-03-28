import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type { Project } from '@/types';
import { getDynamoDocumentClient, encodeCursor, decodeCursor } from './_dynamo-client';

const TABLE = process.env.DYNAMODB_TABLE_PROJECTS ?? 'Projects';

export async function getProjectById(projectId: string): Promise<Project | null> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: `PROJECT#${projectId}`, SK: 'META' },
    })
  );
  return (result.Item as Project) ?? null;
}

export async function createProject(data: Project): Promise<void> {
  const client = getDynamoDocumentClient();
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: data,
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  );
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
  const client = getDynamoDocumentClient();
  const now = new Date().toISOString();
  const { PK: _PK, SK: _SK, ...safeUpdates } = { ...updates, updatedAt: now } as Partial<Project>;

  const parts: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(safeUpdates)) {
    parts.push(`#${key} = :${key}`);
    names[`#${key}`] = key;
    values[`:${key}`] = value;
  }

  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `PROJECT#${projectId}`, SK: 'META' },
      UpdateExpression: `SET ${parts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

export async function softDeleteProject(projectId: string): Promise<void> {
  const client = getDynamoDocumentClient();
  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `PROJECT#${projectId}`, SK: 'META' },
      UpdateExpression: 'SET #isDeleted = :true, #updatedAt = :now',
      ExpressionAttributeNames: { '#isDeleted': 'isDeleted', '#updatedAt': 'updatedAt' },
      ExpressionAttributeValues: { ':true': true, ':now': new Date().toISOString() },
    })
  );
}

export async function listProjects(
  limit?: number,
  cursor?: string,
  statusFilter?: string
): Promise<{ items: Project[]; cursor?: string }> {
  const client = getDynamoDocumentClient();
  const pageSize = limit ?? 50;

  let filterExpression = '#isDeleted = :false';
  const names: Record<string, string> = { '#isDeleted': 'isDeleted' };
  const values: Record<string, unknown> = { ':false': false };

  if (statusFilter) {
    filterExpression += ' AND #status = :status';
    names['#status'] = 'status';
    values[':status'] = statusFilter;
  }

  const params: ConstructorParameters<typeof ScanCommand>[0] = {
    TableName: TABLE,
    FilterExpression: filterExpression,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    Limit: pageSize,
  };

  if (cursor) {
    params.ExclusiveStartKey = decodeCursor(cursor) as Record<string, unknown>;
  }

  const result = await client.send(new ScanCommand(params));
  return {
    items: (result.Items as Project[]) ?? [],
    cursor: result.LastEvaluatedKey
      ? encodeCursor(result.LastEvaluatedKey as Record<string, unknown>)
      : undefined,
  };
}
