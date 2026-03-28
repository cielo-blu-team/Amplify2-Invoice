import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  DocumentHeader,
  LineItem,
  ApprovalRecord,
  DocumentListFilters,
  DocumentStatus,
} from '@/types';
import { getDynamoDocumentClient, encodeCursor, decodeCursor } from './_dynamo-client';

const TABLE = process.env.DYNAMODB_TABLE_DOCUMENTS ?? 'Documents';

// 帳票メタ取得
export async function getDocumentById(documentId: string): Promise<DocumentHeader | null> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new GetCommand({
      TableName: TABLE,
      Key: {
        PK: `DOC#${documentId}`,
        SK: 'META',
      },
    })
  );
  return (result.Item as DocumentHeader) ?? null;
}

// 帳票の明細行取得
export async function getDocumentLineItems(documentId: string): Promise<LineItem[]> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `DOC#${documentId}`,
        ':skPrefix': 'ITEM#',
      },
    })
  );
  return (result.Items as LineItem[]) ?? [];
}

// 帳票作成（META + ITEM レコードをトランザクションで書き込み）
export async function createDocument(
  header: DocumentHeader,
  lineItems: LineItem[]
): Promise<void> {
  const client = getDynamoDocumentClient();
  const transactItems = [
    {
      Put: {
        TableName: TABLE,
        Item: header,
        ConditionExpression: 'attribute_not_exists(PK)',
      },
    },
    ...lineItems.map((item) => ({
      Put: {
        TableName: TABLE,
        Item: item,
      },
    })),
  ];

  await client.send(
    new TransactWriteCommand({
      TransactItems: transactItems,
    })
  );
}

// 帳票メタ更新（draft のみ）
export async function updateDocumentMeta(
  documentId: string,
  updates: Partial<DocumentHeader>
): Promise<void> {
  const client = getDynamoDocumentClient();
  const now = new Date().toISOString();

  // updatedAt を自動設定
  const fieldsToUpdate = { ...updates, updatedAt: now };

  // PK, SK は更新不可なので除外
  const { PK: _PK, SK: _SK, ...safeUpdates } = fieldsToUpdate as Partial<DocumentHeader> & {
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
        PK: `DOC#${documentId}`,
        SK: 'META',
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ConditionExpression: '#status = :draftStatus',
      ExpressionAttributeNames: {
        ...expressionAttributeNames,
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ':draftStatus': 'draft',
      },
    })
  );
}

// 帳票論理削除（isDeleted = true）
export async function softDeleteDocument(documentId: string): Promise<void> {
  const client = getDynamoDocumentClient();
  const now = new Date().toISOString();

  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: {
        PK: `DOC#${documentId}`,
        SK: 'META',
      },
      UpdateExpression: 'SET #isDeleted = :true, #updatedAt = :now',
      ConditionExpression: '#status = :draftStatus',
      ExpressionAttributeNames: {
        '#isDeleted': 'isDeleted',
        '#updatedAt': 'updatedAt',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':true': true,
        ':now': now,
        ':draftStatus': 'draft',
      },
    })
  );
}

// ステータス更新
export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
  additionalUpdates?: Partial<DocumentHeader>
): Promise<void> {
  const client = getDynamoDocumentClient();
  const now = new Date().toISOString();

  const fieldsToUpdate: Record<string, unknown> = {
    status,
    updatedAt: now,
    ...additionalUpdates,
  };

  // PK, SK は更新不可なので除外
  delete fieldsToUpdate['PK'];
  delete fieldsToUpdate['SK'];

  const updateExpressionParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fieldsToUpdate)) {
    updateExpressionParts.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = value;
  }

  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: {
        PK: `DOC#${documentId}`,
        SK: 'META',
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

// 承認履歴追加
export async function addApprovalRecord(
  documentId: string,
  record: Omit<ApprovalRecord, 'PK' | 'SK'>
): Promise<void> {
  const client = getDynamoDocumentClient();
  const item: ApprovalRecord = {
    ...record,
    PK: `DOC#${documentId}`,
    SK: `APPROVAL#${record.timestamp}`,
  };

  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
    })
  );
}

// 承認履歴取得
export async function getApprovalHistory(documentId: string): Promise<ApprovalRecord[]> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `DOC#${documentId}`,
        ':skPrefix': 'APPROVAL#',
      },
      ScanIndexForward: true,
    })
  );
  return (result.Items as ApprovalRecord[]) ?? [];
}

// 帳票一覧（フィルタ・ページネーション対応）
// ステータスが単一指定の場合は GSI-Status を使用、それ以外は Scan + FilterExpression
export async function listDocuments(filters: DocumentListFilters): Promise<{
  items: DocumentHeader[];
  cursor?: string;
}> {
  const client = getDynamoDocumentClient();
  const limit = filters.limit ?? 20;

  const filterExpressionParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {
    '#SK': 'SK',
    '#isDeleted': 'isDeleted',
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ':skMeta': 'META',
    ':false': false,
  };

  // SK = META のみ（ヘッダーレコードのみ取得）
  filterExpressionParts.push('#SK = :skMeta');
  filterExpressionParts.push('#isDeleted = :false');

  if (filters.documentType) {
    filterExpressionParts.push('#documentType = :documentType');
    expressionAttributeNames['#documentType'] = 'documentType';
    expressionAttributeValues[':documentType'] = filters.documentType;
  }

  if (filters.clientName) {
    filterExpressionParts.push('contains(#clientName, :clientName)');
    expressionAttributeNames['#clientName'] = 'clientName';
    expressionAttributeValues[':clientName'] = filters.clientName;
  }

  if (filters.documentNumber) {
    filterExpressionParts.push('contains(#documentNumber, :documentNumber)');
    expressionAttributeNames['#documentNumber'] = 'documentNumber';
    expressionAttributeValues[':documentNumber'] = filters.documentNumber;
  }

  if (filters.issueDateFrom) {
    filterExpressionParts.push('#issueDate >= :issueDateFrom');
    expressionAttributeNames['#issueDate'] = 'issueDate';
    expressionAttributeValues[':issueDateFrom'] = filters.issueDateFrom;
  }

  if (filters.issueDateTo) {
    if (!expressionAttributeNames['#issueDate']) {
      expressionAttributeNames['#issueDate'] = 'issueDate';
    }
    filterExpressionParts.push('#issueDate <= :issueDateTo');
    expressionAttributeValues[':issueDateTo'] = filters.issueDateTo;
  }

  if (filters.amountMin !== undefined) {
    filterExpressionParts.push('#totalAmount >= :amountMin');
    expressionAttributeNames['#totalAmount'] = 'totalAmount';
    expressionAttributeValues[':amountMin'] = filters.amountMin;
  }

  if (filters.amountMax !== undefined) {
    if (!expressionAttributeNames['#totalAmount']) {
      expressionAttributeNames['#totalAmount'] = 'totalAmount';
    }
    filterExpressionParts.push('#totalAmount <= :amountMax');
    expressionAttributeValues[':amountMax'] = filters.amountMax;
  }

  if (filters.createdBy) {
    filterExpressionParts.push('#createdBy = :createdBy');
    expressionAttributeNames['#createdBy'] = 'createdBy';
    expressionAttributeValues[':createdBy'] = filters.createdBy;
  }

  const exclusiveStartKey = filters.cursor
    ? (decodeCursor(filters.cursor) as Record<string, unknown>)
    : undefined;

  // ステータスが単一指定の場合は GSI-Status で Query
  if (filters.status && filters.status.length === 1) {
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':singleStatus'] = filters.status[0];

    const queryParams: ConstructorParameters<typeof QueryCommand>[0] = {
      TableName: TABLE,
      IndexName: 'GSI-Status',
      KeyConditionExpression: '#status = :singleStatus',
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
    };

    if (filterExpressionParts.length > 0) {
      queryParams.FilterExpression = filterExpressionParts.join(' AND ');
    }

    if (exclusiveStartKey) {
      queryParams.ExclusiveStartKey = exclusiveStartKey;
    }

    const result = await client.send(new QueryCommand(queryParams));
    return {
      items: (result.Items as DocumentHeader[]) ?? [],
      cursor: result.LastEvaluatedKey
        ? encodeCursor(result.LastEvaluatedKey as Record<string, unknown>)
        : undefined,
    };
  }

  // 複数ステータスまたはステータス未指定は Scan + FilterExpression
  if (filters.status && filters.status.length > 1) {
    const statusConditions = filters.status.map((s, i) => {
      expressionAttributeValues[`:status${i}`] = s;
      return `:status${i}`;
    });
    filterExpressionParts.push(`#status IN (${statusConditions.join(', ')})`);
    expressionAttributeNames['#status'] = 'status';
  }

  const scanParams: ConstructorParameters<typeof ScanCommand>[0] = {
    TableName: TABLE,
    FilterExpression: filterExpressionParts.join(' AND '),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    Limit: limit,
  };

  if (exclusiveStartKey) {
    scanParams.ExclusiveStartKey = exclusiveStartKey;
  }

  const result = await client.send(new ScanCommand(scanParams));
  return {
    items: (result.Items as DocumentHeader[]) ?? [],
    cursor: result.LastEvaluatedKey
      ? encodeCursor(result.LastEvaluatedKey as Record<string, unknown>)
      : undefined,
  };
}

// 取引先IDで帳票一覧取得（GSI-ClientId）
export async function listDocumentsByClientId(
  clientId: string,
  limit?: number,
  cursor?: string
): Promise<{ items: DocumentHeader[]; cursor?: string }> {
  const client = getDynamoDocumentClient();
  const pageSize = limit ?? 20;

  const params: ConstructorParameters<typeof QueryCommand>[0] = {
    TableName: TABLE,
    IndexName: 'GSI-ClientId',
    KeyConditionExpression: '#clientId = :clientId',
    FilterExpression: '#SK = :skMeta AND #isDeleted = :false',
    ExpressionAttributeNames: {
      '#clientId': 'clientId',
      '#SK': 'SK',
      '#isDeleted': 'isDeleted',
    },
    ExpressionAttributeValues: {
      ':clientId': clientId,
      ':skMeta': 'META',
      ':false': false,
    },
    Limit: pageSize,
  };

  if (cursor) {
    params.ExclusiveStartKey = decodeCursor(cursor) as Record<string, unknown>;
  }

  const result = await client.send(new QueryCommand(params));
  const items = (result.Items as DocumentHeader[]) ?? [];

  return {
    items,
    cursor: result.LastEvaluatedKey ? encodeCursor(result.LastEvaluatedKey as Record<string, unknown>) : undefined,
  };
}
