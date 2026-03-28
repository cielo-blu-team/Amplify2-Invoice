// EventBridge 毎日10:00トリガー
import { paymentService } from '../../../src/services/payment.service';
import { moneyForwardClient } from '../../../src/lib/money-forward-client';

export const handler = async (event: unknown) => {
  console.log('[PaymentBatch] Starting payment matching batch', event);
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const mfTransfers = await moneyForwardClient.getTransfers(yesterday, today);
    console.log(`[PaymentBatch] ${mfTransfers.length}件の入金データを取得`);
    const transfers = mfTransfers.map((t) => ({
      transferId: t.id,
      amount: t.amount,
      remitterName: t.remitterName,
      transferDate: t.date,
      bankName: t.bankAccount,
    }));
    const results = await paymentService.matchPayments(transfers);
    const fullMatches = results.filter((r) => r.matchStatus === 'full');
    for (const match of fullMatches) {
      await paymentService.confirmPayment(match.documentId, match.transferId);
      console.log(`[PaymentBatch] 自動入金確定: ${match.documentNumber}`);
    }
    console.log(
      `[PaymentBatch] 完了: ${fullMatches.length}件自動確定, ${results.length - fullMatches.length}件要確認`
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ matched: results.length, confirmed: fullMatches.length }),
    };
  } catch (e) {
    console.error('[PaymentBatch] Error:', e);
    throw e;
  }
};
