import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminDisableUserCommand,
  AdminResetUserPasswordCommand,
  ListUsersCommand,
  type MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Role } from '@/types/user';

const cognitoClient = new CognitoIdentityProviderClient({});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? '';

// AWS SDK が未設定（USER_POOL_ID が空）の場合は警告を出すユーティリティ
function assertUserPoolId(): void {
  if (!USER_POOL_ID) {
    throw new Error(
      'COGNITO_USER_POOL_ID が設定されていません。環境変数を確認してください。',
    );
  }
}

export async function getUser(username: string) {
  assertUserPoolId();
  const response = await cognitoClient.send(
    new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    }),
  );
  return response;
}

export async function listUsers(limit = 60) {
  assertUserPoolId();
  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: limit,
    }),
  );
  return response.Users ?? [];
}

/**
 * ユーザー作成（AdminCreateUser）
 * 作成後、Cognito から招待メールが送信される（MessageAction: 'SUPPRESS' で抑制可能）
 */
export async function createUser(
  email: string,
  displayName: string,
  role: Role,
  suppressInviteEmail = false,
) {
  assertUserPoolId();
  const response = await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      MessageAction: suppressInviteEmail ? ('SUPPRESS' as MessageActionType) : undefined,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: displayName },
        { Name: 'custom:role', Value: role },
      ],
    }),
  );
  return response.User;
}

/**
 * パスワードリセット（管理者が一時パスワードを設定）
 * permanent: true の場合は恒久パスワードとして設定（ユーザーへの変更強制なし）
 */
export async function setTemporaryPassword(
  username: string,
  temporaryPassword: string,
  permanent = false,
) {
  assertUserPoolId();
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: temporaryPassword,
      Permanent: permanent,
    }),
  );
}

/**
 * パスワードリセット（ユーザーにリセットメールを送信）
 */
export async function resetUserPassword(username: string) {
  assertUserPoolId();
  await cognitoClient.send(
    new AdminResetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    }),
  );
}

/**
 * ユーザー無効化（ログイン不可にするが、データは保持される）
 */
export async function disableUser(username: string) {
  assertUserPoolId();
  await cognitoClient.send(
    new AdminDisableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    }),
  );
}

export { cognitoClient, USER_POOL_ID };
