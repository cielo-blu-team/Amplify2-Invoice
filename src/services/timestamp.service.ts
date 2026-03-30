// 電子帳簿保存法対応タイムスタンプサービス
//
// 現在の実装: Firestore にドキュメントハッシュ＋タイムスタンプを保存し、
// トークンで再取得・検証できる内部実装。
//
// 法的有効性が必要な場合は applyTimestamp() 内の EXTERNAL_TSA ブロックを有効化し、
// アマノタイムスタンプ / セイコーソリューションズ 等の認定 TSA API に差し替えること。

import { getFirestoreClient } from '@/repositories/_firestore-client';

const TIMESTAMP_COLLECTION = 'timestamps';

export interface TimestampResult {
  token: string;
  timestamp: string; // ISO8601
  hashAlgorithm: 'SHA-256';
  documentHash: string;
  status: 'applied' | 'verified' | 'expired';
}

class TimestampService {
  async applyTimestamp(documentId: string, pdfBuffer: Buffer): Promise<TimestampResult> {
    const hash = await this.computeSha256(pdfBuffer);
    const timestamp = new Date().toISOString();
    const token = `TST-${documentId}-${Date.now()}`;

    // Firestore にハッシュ＋タイムスタンプを保存
    await getFirestoreClient()
      .collection(TIMESTAMP_COLLECTION)
      .doc(token)
      .set({
        documentId,
        token,
        timestamp,
        documentHash: hash,
        hashAlgorithm: 'SHA-256',
        status: 'applied',
      });

    // --- EXTERNAL_TSA (認定タイムスタンプが必要な場合はここを有効化) ---
    // const tsaResponse = await this.callTsaApi(hash, documentId);
    // token = tsaResponse.token;
    // timestamp = tsaResponse.timestamp;
    // await updateFirestoreRecord(token, tsaResponse);
    // -----------------------------------------------------------------------

    return { token, timestamp, hashAlgorithm: 'SHA-256', documentHash: hash, status: 'applied' };
  }

  async verifyTimestamp(token: string, pdfBuffer: Buffer): Promise<boolean> {
    const snap = await getFirestoreClient()
      .collection(TIMESTAMP_COLLECTION)
      .doc(token)
      .get();

    if (!snap.exists) return false;

    const record = snap.data()!;
    if (record.status === 'expired') return false;

    // 現在の PDF ハッシュと保存済みハッシュを照合
    const currentHash = await this.computeSha256(pdfBuffer);
    return currentHash === record.documentHash;
  }

  private async computeSha256(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}

export const timestampService = new TimestampService();
