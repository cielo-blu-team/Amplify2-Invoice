import * as userRepo from '@/repositories/user.repository';

export interface SlackUserMapping {
  userId: string;
  slackUserId: string;
  slackTeamId: string;
}

/**
 * Firebase UID から Slack ユーザーID を取得する
 */
export async function getSlackUserId(firebaseUid: string): Promise<string | null> {
  const user = await userRepo.getUserByFirebaseUid(firebaseUid);
  return user?.slackUserId ?? null;
}

/**
 * Firebase UID に Slack ユーザーID を紐付けて Firestore に保存する
 */
export async function linkSlackUser(
  firebaseUid: string,
  slackUserId: string,
  slackTeamId: string,
): Promise<void> {
  const user = await userRepo.getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error(`ユーザーが見つかりません: ${firebaseUid}`);
  await userRepo.updateUser(user.userId, { slackUserId, slackTeamId });
}
