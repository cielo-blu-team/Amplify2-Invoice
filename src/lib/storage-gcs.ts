/**
 * Cloud Storage クライアント
 * S3 クライアント（src/lib/s3.ts）の置き換え
 * 同一の関数シグネチャを維持
 */
import { Storage } from '@google-cloud/storage';
import type { Readable } from 'stream';
import { GCS_PATHS } from './constants';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
});

const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const ARCHIVE_BUCKET_NAME = process.env.GCS_ARCHIVE_BUCKET_NAME;

if (!BUCKET_NAME) {
  throw new Error('GCS_BUCKET_NAME が設定されていません。環境変数を確認してください。');
}
if (!ARCHIVE_BUCKET_NAME) {
  throw new Error('GCS_ARCHIVE_BUCKET_NAME が設定されていません。環境変数を確認してください。');
}

export async function uploadDocument(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const fullKey = `${GCS_PATHS.DOCUMENTS}/${key}`;
  const file = storage.bucket(BUCKET_NAME).file(fullKey);
  await file.save(Buffer.from(body), {
    metadata: { contentType },
    resumable: false,
  });
  return fullKey;
}

export async function uploadImage(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const fullKey = `${GCS_PATHS.IMAGES}/${key}`;
  const file = storage.bucket(BUCKET_NAME).file(fullKey);
  await file.save(Buffer.from(body), {
    metadata: { contentType },
    resumable: false,
  });
  return fullKey;
}

export async function getObject(key: string): Promise<Readable | null> {
  try {
    const file = storage.bucket(BUCKET_NAME).file(key);
    return file.createReadStream();
  } catch {
    return null;
  }
}

/**
 * アーカイブバケットへのアップロード（電帳法対応）
 */
export async function archiveDocument(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const fullKey = `${GCS_PATHS.ARCHIVES}/${key}`;
  const file = storage.bucket(ARCHIVE_BUCKET_NAME).file(fullKey);
  await file.save(Buffer.from(body), {
    metadata: { contentType },
    resumable: false,
  });
  return fullKey;
}

/**
 * 署名付き URL の生成（ダウンロード用）
 * S3 getSignedUrl 相当
 */
export async function getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const [url] = await storage.bucket(BUCKET_NAME).file(key).getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInSeconds * 1000,
  });
  return url;
}

export { storage, BUCKET_NAME, ARCHIVE_BUCKET_NAME };
