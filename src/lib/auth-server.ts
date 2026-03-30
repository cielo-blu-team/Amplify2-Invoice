import { cookies } from 'next/headers';
import { getRoleFromClaims } from '@/lib/auth';
import type { Role } from '@/types/user';

interface FirebaseTokenClaims {
  sub: string;
  user_id?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

/**
 * httpOnly Cookie から Firebase ID トークンのペイロードを JWT デコードして返す。
 * ミドルウェアでトークン存在確認済みのため、署名検証は省略して高速に取得する。
 */
function decodeIdToken(token: string): FirebaseTokenClaims | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('firebase-id-token')?.value;
  if (!token) return 'unknown';
  const claims = decodeIdToken(token);
  return claims?.user_id ?? claims?.sub ?? 'unknown';
}

export async function getCurrentUserDisplayName(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('firebase-id-token')?.value;
  if (!token) return '不明なユーザー';
  const claims = decodeIdToken(token);
  return claims?.name ?? claims?.email ?? '不明なユーザー';
}

export async function getCurrentUserRole(): Promise<Role> {
  const cookieStore = await cookies();
  const token = cookieStore.get('firebase-id-token')?.value;
  if (!token) return 'user';
  const claims = decodeIdToken(token);
  return getRoleFromClaims(claims ?? {});
}
