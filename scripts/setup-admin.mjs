/**
 * 既存 Google アカウントに管理者ロールを付与し、Firestore ユーザードキュメントを作成するスクリプト
 * 使用方法: GCP_PROJECT_ID=<project-id> node scripts/setup-admin.mjs <email>
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

const email = process.argv[2];
if (!email) {
  console.error('使用方法: GCP_PROJECT_ID=<project-id> node scripts/setup-admin.mjs <email>');
  process.exit(1);
}

const projectId = process.env.GCP_PROJECT_ID;
if (!projectId) {
  console.error('GCP_PROJECT_ID 環境変数を設定してください');
  process.exit(1);
}

// Firebase Admin 初期化（ADC または サービスアカウントキー）
if (getApps().length === 0) {
  const credJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (credJson) {
    initializeApp({
      credential: cert(JSON.parse(Buffer.from(credJson, 'base64').toString('utf-8'))),
      projectId,
    });
  } else {
    initializeApp({ projectId });
  }
}

const auth = getAuth();
const db = getFirestore();

async function main() {
  console.log(`\n対象メールアドレス: ${email}`);

  // Firebase Auth からユーザー取得
  let firebaseUser;
  try {
    firebaseUser = await auth.getUserByEmail(email);
    console.log(`Firebase Auth ユーザー確認: uid=${firebaseUser.uid}`);
  } catch (e) {
    console.error(`Firebase Auth にユーザーが存在しません: ${email}`);
    console.error('先に Google ログインでアカウントを作成してください');
    process.exit(1);
  }

  // カスタムクレームに role=admin を設定
  const existingClaims = firebaseUser.customClaims ?? {};
  await auth.setCustomUserClaims(firebaseUser.uid, { ...existingClaims, role: 'admin' });
  console.log('カスタムクレーム設定完了: role=admin');

  // Firestore ユーザードキュメントの作成 or 更新
  const now = new Date().toISOString();
  const usersRef = db.collection('users');

  // 既存ドキュメントを検索（firebaseUid or cognitoSub）
  const existingSnap = await usersRef
    .where('cognitoSub', '==', firebaseUser.uid)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    const docId = existingSnap.docs[0].id;
    await usersRef.doc(docId).update({ role: 'admin', updatedAt: now });
    console.log(`Firestore ユーザードキュメント更新完了: id=${docId}`);
  } else {
    const userId = randomUUID();
    const userData = {
      PK: `USER#${userId}`,
      SK: 'META',
      cognitoSub: firebaseUser.uid,
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName ?? firebaseUser.email,
      role: 'admin',
      notificationSettings: {
        approval_request: true,
        approval_result: true,
        payment_result: true,
        payment_alert_7d: true,
        payment_alert_3d: true,
        payment_alert_today: true,
        overdue: true,
        document_created: true,
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await usersRef.doc(userId).set(userData);
    console.log(`Firestore ユーザードキュメント新規作成完了: id=${userId}`);
  }

  console.log('\n✅ 完了しました。次回ログイン時に管理者権限が有効になります。');
}

main().catch((e) => {
  console.error('エラー:', e);
  process.exit(1);
});
