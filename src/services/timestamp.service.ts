// src/services/timestamp.service.ts
// 電子帳簿保存法対応タイムスタンプサービス（スタブ実装）
// 実際の実装時はアマノタイムスタンプ or セイコーソリューションズ API に差し替える

export interface TimestampResult {
  token: string;
  timestamp: string; // ISO8601
  hashAlgorithm: 'SHA-256';
  documentHash: string;
  status: 'applied' | 'verified' | 'expired';
}

class TimestampService {
  async applyTimestamp(documentId: string, pdfBuffer: Buffer): Promise<TimestampResult> {
    // TODO: 認定タイムスタンプサービスAPI呼び出し
    // 現在はモック実装
    const hash = await this.computeSha256(pdfBuffer);
    return {
      token: `TST-STUB-${documentId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      hashAlgorithm: 'SHA-256',
      documentHash: hash,
      status: 'applied',
    };
  }

  async verifyTimestamp(token: string, pdfBuffer: Buffer): Promise<boolean> {
    // TODO: タイムスタンプ検証API呼び出し
    return token.startsWith('TST-');
  }

  private async computeSha256(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}

export const timestampService = new TimestampService();
