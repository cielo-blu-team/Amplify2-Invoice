// Cognito JWT検証（スタブ - 本番ではaws-jwt-verifyを使用）
export async function verifyJwt(token) {
    if (!token || token === 'invalid') {
        throw { code: 'PERMISSION_DENIED', message: '認証が必要です' };
    }
    // TODO: 本番実装: aws-jwt-verify でCognito JWT検証
    // const verifier = CognitoJwtVerifier.create({ userPoolId: process.env.COGNITO_USER_POOL_ID!, tokenUse: 'access', clientId: process.env.COGNITO_CLIENT_ID! });
    // const payload = await verifier.verify(token);
    return { userId: 'user-001', email: 'user@example.com', role: 'admin', token };
}
//# sourceMappingURL=auth.js.map