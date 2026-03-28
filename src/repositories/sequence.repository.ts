import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocumentClient } from './_dynamo-client';

const TABLE = process.env.DYNAMODB_TABLE_SEQUENCES ?? 'Sequences';

// DynamoDB ADD アトミック操作で連番を採番
// PK=SEQ#{type}#{date}, SK=COUNTER
// 戻り値: 採番されたシーケンス番号（1始まり）
// date形式: YYYYMMDD
export async function getNextSequence(type: 'EST' | 'INV', date: string): Promise<number> {
  const client = getDynamoDocumentClient();

  const result = await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: {
        PK: `SEQ#${type}#${date}`,
        SK: 'COUNTER',
      },
      UpdateExpression: 'ADD #counter :inc',
      ExpressionAttributeNames: {
        '#counter': 'counter',
      },
      ExpressionAttributeValues: {
        ':inc': 1,
      },
      ReturnValues: 'UPDATED_NEW',
    })
  );

  const counter = result.Attributes?.['counter'] as number;
  return counter;
}
