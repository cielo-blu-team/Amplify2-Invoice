import type { LineItemInput, TaxSummary } from '@/types/document';

/**
 * 消費税計算（設計書 7.2）
 * - 税率区分ごとの合計金額に対して切り捨て（明細行単位ではない）
 * - インボイス制度対応: 10%・8%（軽減税率）・非課税の3区分
 */
export function calculateTax(items: LineItemInput[]): TaxSummary {
  let tax10Subtotal = 0;
  let tax8Subtotal = 0;
  let taxExemptSubtotal = 0;

  for (const item of items) {
    const amount = item.quantity * item.unitPrice;
    if (item.taxRate === 10) {
      tax10Subtotal += amount;
    } else if (item.taxRate === 8) {
      tax8Subtotal += amount;
    } else {
      taxExemptSubtotal += amount;
    }
  }

  // 税率区分ごとの合計に対して切り捨て（設計書 7.2: Math.floor(subtotal * taxRate / 100)）
  const tax10Amount = Math.floor(tax10Subtotal * 10 / 100);
  const tax8Amount = Math.floor(tax8Subtotal * 8 / 100);

  const subtotal = tax10Subtotal + tax8Subtotal + taxExemptSubtotal;
  const taxAmount = tax10Amount + tax8Amount;

  return {
    subtotal,
    tax10Subtotal,
    tax10Amount,
    tax8Subtotal,
    tax8Amount,
    taxExemptSubtotal,
    taxAmount,
    totalAmount: subtotal + taxAmount,
  };
}
