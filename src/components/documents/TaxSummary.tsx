interface TaxSummaryProps {
  taxSummary: {
    subtotal: number;
    tax10Subtotal: number;
    tax10Amount: number;
    tax8Subtotal: number;
    tax8Amount: number;
    taxExemptSubtotal: number;
    taxAmount: number;
    totalAmount: number;
  };
}

function formatCurrency(value: number): string {
  return value.toLocaleString('ja-JP');
}

export default function TaxSummary({ taxSummary }: TaxSummaryProps) {
  const has8 = taxSummary.tax8Subtotal > 0;
  const hasExempt = taxSummary.taxExemptSubtotal > 0;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="w-full min-w-[360px] max-w-sm border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {/* 10%対象 */}
            <tr className="border-b border-zinc-100">
              <td className="px-4 py-2 text-zinc-600">10%対象小計</td>
              <td className="px-4 py-2 text-right text-zinc-800">
                ¥{formatCurrency(taxSummary.tax10Subtotal)}
              </td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="px-4 py-2 text-zinc-600">消費税（10%）</td>
              <td className="px-4 py-2 text-right text-zinc-800">
                ¥{formatCurrency(taxSummary.tax10Amount)}
              </td>
            </tr>

            {/* 8%対象（明細がある場合のみ） */}
            {has8 && (
              <>
                <tr className="border-b border-zinc-100">
                  <td className="px-4 py-2 text-zinc-600">8%対象小計※</td>
                  <td className="px-4 py-2 text-right text-zinc-800">
                    ¥{formatCurrency(taxSummary.tax8Subtotal)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="px-4 py-2 text-zinc-600">消費税（8%）※</td>
                  <td className="px-4 py-2 text-right text-zinc-800">
                    ¥{formatCurrency(taxSummary.tax8Amount)}
                  </td>
                </tr>
              </>
            )}

            {/* 非課税小計（明細がある場合のみ） */}
            {hasExempt && (
              <tr className="border-b border-zinc-100">
                <td className="px-4 py-2 text-zinc-600">非課税小計</td>
                <td className="px-4 py-2 text-right text-zinc-800">
                  ¥{formatCurrency(taxSummary.taxExemptSubtotal)}
                </td>
              </tr>
            )}

            {/* 消費税合計 */}
            <tr className="border-b border-zinc-200">
              <td className="px-4 py-2 font-medium text-zinc-700">消費税合計</td>
              <td className="px-4 py-2 text-right font-medium text-zinc-800">
                ¥{formatCurrency(taxSummary.taxAmount)}
              </td>
            </tr>

            {/* 合計（税込）*/}
            <tr className="bg-zinc-50">
              <td className="px-4 py-3 text-lg font-bold text-zinc-900">合計（税込）</td>
              <td className="px-4 py-3 text-right text-lg font-bold text-zinc-900">
                ¥{formatCurrency(taxSummary.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 軽減税率注記（8%の明細がある場合のみ） */}
      {has8 && (
        <p className="text-xs text-zinc-400">※ 軽減税率（8%）対象</p>
      )}
    </div>
  );
}
