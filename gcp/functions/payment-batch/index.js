'use strict';
const { initializeApp, getApps } = require('firebase-admin/app');

if (getApps().length === 0) {
  initializeApp();
}

// Cloud Scheduler から HTTP POST でトリガー（毎日 10:00 JST）
exports.handler = async (_req, res) => {
  console.log('[PaymentBatch] Starting payment matching batch');

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // MoneyForward API クライアントは環境変数 MONEYFORWARD_API_KEY を使用
    // 実装は src/lib/money-forward-client.ts を参照
    const apiKey = process.env.MONEYFORWARD_API_KEY;
    if (!apiKey || apiKey === 'mf_dummy_api_key') {
      console.log('[PaymentBatch] MoneyForward API キー未設定のためスキップ');
      return res.status(200).json({ statusCode: 200, matched: 0, confirmed: 0, skipped: true });
    }

    // TODO: MoneyForward API 呼び出し & Firestore への入金照合ロジックを実装
    console.log(`[PaymentBatch] 対象期間: ${yesterday} → ${today}`);
    res.status(200).json({ statusCode: 200, matched: 0, confirmed: 0 });
  } catch (e) {
    console.error('[PaymentBatch] Error:', e);
    res.status(500).json({ statusCode: 500, error: String(e) });
  }
};
