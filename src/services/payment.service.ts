import * as documentRepo from '@/repositories/document.repository';

export type MatchStatus = 'full' | 'partial' | 'mismatch' | 'unmatched';

export interface BankTransfer {
  transferId: string;
  amount: number;
  remitterName: string; // 振込名義（カタカナ）
  transferDate: string; // YYYY-MM-DD
  bankName?: string;
}

export interface PaymentMatchResult {
  documentId: string;
  documentNumber: string;
  clientName: string;
  invoiceAmount: number;
  transferAmount: number;
  matchStatus: MatchStatus;
  confidence: number; // 0-100
  transferId: string;
  needsManualReview: boolean;
}

// カタカナ → ひらがな変換
function kanaToHira(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

// 名義の正規化（スペース除去、大文字化、カナ統一）
function normalizeName(name: string): string {
  return kanaToHira(name).replace(/\s+/g, '').replace(/（.*?）|\(.*?\)/g, '').toUpperCase();
}

class PaymentService {
  // 入金照合（3B-01）
  async matchPayments(transfers: BankTransfer[]): Promise<PaymentMatchResult[]> {
    // 未入金の請求書を取得（GSI-Status で status = 'sent' を検索）
    const { items: invoices } = await documentRepo.listDocuments({
      status: ['sent'],
      limit: 100,
    });
    const results: PaymentMatchResult[] = [];

    for (const transfer of transfers) {
      let bestMatch: PaymentMatchResult | null = null;
      let bestScore = 0;

      for (const invoice of invoices) {
        if (invoice.documentType !== 'invoice') continue;

        // 金額マッチング
        const amountDiff = Math.abs(invoice.totalAmount - transfer.amount);
        const amountScore = amountDiff === 0 ? 100 : amountDiff < invoice.totalAmount * 0.01 ? 50 : 0;

        // 名義マッチング
        const normalizedRemitter = normalizeName(transfer.remitterName);
        const normalizedClient = normalizeName(invoice.clientName);
        const nameMatch =
          normalizedClient.includes(normalizedRemitter) ||
          normalizedRemitter.includes(normalizedClient);
        const nameScore = nameMatch ? 100 : 0;

        const totalScore = amountScore * 0.6 + nameScore * 0.4;
        if (totalScore > bestScore) {
          bestScore = totalScore;
          const matchStatus: MatchStatus =
            amountDiff === 0 && nameMatch
              ? 'full'
              : amountDiff < invoice.totalAmount && nameMatch
                ? 'partial'
                : amountDiff === 0
                  ? 'mismatch'
                  : 'unmatched';
          bestMatch = {
            documentId: invoice.documentId,
            documentNumber: invoice.documentNumber,
            clientName: invoice.clientName,
            invoiceAmount: invoice.totalAmount,
            transferAmount: transfer.amount,
            matchStatus,
            confidence: Math.round(totalScore),
            transferId: transfer.transferId,
            needsManualReview: matchStatus !== 'full',
          };
        }
      }
      if (bestMatch && bestScore > 40) results.push(bestMatch);
    }
    return results;
  }

  // 入金確定処理
  async confirmPayment(documentId: string, _transferId: string): Promise<void> {
    // paidAt / transferId は DocumentHeader に含まれないため notes に記録する設計
    await documentRepo.updateDocumentStatus(documentId, 'paid');
  }
}

export const paymentService = new PaymentService();
