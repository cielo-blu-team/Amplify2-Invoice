// SlackユーザーID ↔ CognitoユーザーID紐付け
// DynamoDBのUsersテーブルにslackUserIdフィールドを追加して管理

export interface SlackUserMapping {
  cognitoUserId: string;
  slackUserId: string;
  slackTeamId: string;
}

// TODO: DynamoDBから取得
export async function getSlackUserId(cognitoUserId: string): Promise<string | null> {
  // 実装: UserRepositoryからslackUserIdを取得
  return null;
}

export async function linkSlackUser(
  cognitoUserId: string,
  slackUserId: string,
  slackTeamId: string
): Promise<void> {
  // 実装: UserRepositoryでslackUserIdを保存
  console.log(`[SlackMapping] ${cognitoUserId} → ${slackUserId}`);
}
