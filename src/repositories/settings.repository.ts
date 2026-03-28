import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { CompanySettings } from '@/types';
import { getDynamoDocumentClient } from './_dynamo-client';

const TABLE = process.env.DYNAMODB_TABLE_SETTINGS ?? 'Settings';

const COMPANY_PK = 'SETTING#company';
const COMPANY_SK = 'META';

// 自社情報取得（PK=SETTING#company, SK=META）
export async function getCompanySettings(): Promise<CompanySettings | null> {
  const client = getDynamoDocumentClient();
  const result = await client.send(
    new GetCommand({
      TableName: TABLE,
      Key: {
        PK: COMPANY_PK,
        SK: COMPANY_SK,
      },
    })
  );
  if (!result.Item) return null;

  // PK, SK を除いた CompanySettings を返す
  const { PK: _PK, SK: _SK, ...settings } = result.Item;
  return settings as CompanySettings;
}

// 自社情報保存（put）
export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  const client = getDynamoDocumentClient();
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: COMPANY_PK,
        SK: COMPANY_SK,
        ...settings,
      },
    })
  );
}
