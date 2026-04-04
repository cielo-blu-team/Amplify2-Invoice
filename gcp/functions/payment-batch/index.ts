import type { Request, Response } from 'express';
import { paymentService, type BankTransfer } from '../../src/services/payment.service';

/**
 * 入金照合バッチ
 * Cloud Scheduler から HTTP POST でトリガー（毎日 10:00 JST）
 *
 * リクエストボディに振込データを含める（銀行システムや会計ソフトからエクスポートしたデータ）
 * Body: { transfers: BankTransfer[] }
 *
 * 注: MF クラウド経費 API は経費精算向けのため銀行振込履歴は提供されません。
 *     振込データは銀行のネットバンキングや会計ソフトからエクスポートして渡してください。
 */
export const handler = async (req: Request, res: Response) => {
  console.log('[PaymentBatch] Starting payment matching batch');

  try {
    const transfers: BankTransfer[] = req.body?.transfers ?? [];

    if (transfers.length === 0) {
      console.log('[PaymentBatch] 振込データなし - スキップ');
      res.status(200).json({ statusCode: 200, matched: 0, confirmed: 0 });
      return;
    }

    console.log(`[PaymentBatch] ${transfers.length}件の振込データで照合開始`);

    const results = await paymentService.matchPayments(transfers);
    const fullMatches = results.filter((r: { matchStatus: string }) => r.matchStatus === 'full');

    for (const match of fullMatches) {
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
