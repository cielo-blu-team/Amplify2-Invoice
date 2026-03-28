import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { S3_PATHS } from './constants';

const s3Client = new S3Client({});

const BUCKET_NAME = process.env.S3_BUCKET_NAME ?? '';

export async function uploadDocument(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const fullKey = `${S3_PATHS.DOCUMENTS}/${key}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullKey,
      Body: body,
      ContentType: contentType,
    }),
  );
  return fullKey;
}

export async function uploadImage(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const fullKey = `${S3_PATHS.IMAGES}/${key}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullKey,
      Body: body,
      ContentType: contentType,
    }),
  );
  return fullKey;
}

export async function getObject(key: string): Promise<ReadableStream | null> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
  return (response.Body as ReadableStream) ?? null;
}

export { s3Client, BUCKET_NAME };
