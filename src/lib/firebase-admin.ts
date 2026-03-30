import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let appInstance: App | null = null;

function getFirebaseAdminApp(): App {
  if (appInstance) return appInstance;

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error('GCP_PROJECT_ID が設定されていません。環境変数を確認してください。');
  }

  const credentialsJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (credentialsJson) {
    appInstance = initializeApp({
      credential: cert(JSON.parse(Buffer.from(credentialsJson, 'base64').toString('utf-8'))),
      projectId,
    });
  } else {
    // Cloud Run / Cloud Functions 上では Application Default Credentials を使用
    appInstance = initializeApp({ projectId });
  }

  return appInstance;
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}
