import type { Request, Response } from 'express';
import { moneyForwardClient } from '../../src/lib/money-forward-client';
import { paymentService } from '../../src/services/payment.service';

// Cloud Scheduler から HTTP POST でトリガー（毎日 10:00 JST）
// EventBridge payment-batch の移行版
export const handler = async (_req: Request, res: Response) => {
  console.log('[PaymentBatch] Starting payment matching batch');

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const mfTransfers = await moneyForwardClient.getTransfers(yesterday, today);
    console.log(`[PaymentBatch] ${mfTransfers.length}件の入金データを取得`);

    const transfers = mfTransfers.map((t: {
      id: string;
      amount: number;
      remitterName: string;
      date: string;
      bankAccount: string;
    }) => ({
      transferId: t.id,
      amount: t.amount,
      remitterName: t.remitterName,
      transferDate: t.date,
      bankName: t.bankAccount,
    }));

    const results = await paymentService.matchPayments(transfers);
    const fullMatches = results.filter(
      (r: { matchStatus: string }) => r.matchStatus === 'full'
    );

    for (const match of fullMatches as Array<{
      documentId: string;
      transferId: string;
      documentNumber: string;
    }>) {
      await paymentService.confirmPayment(match.documentId, match.transferId);
      console.log(`[PaymentBatch] 自動入金確定: ${match.documentNumber}`);
    }

    console.log(
      `[PaymentBatch] 完了: ${fullMatches.length}件自動確定, ${results.length - fullMatches.length}件要確認`
    );

    res.status(200).json({
      statusCode: 200,
      matched: results.length,
      confirmed: fullMatches.length,
    });
  } catch (e) {
    console.error('[PaymentBatch] Error:', e);
    res.status(500).json({ statusCode: 500, error: String(e) });
  }
};
