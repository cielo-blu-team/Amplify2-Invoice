import { calculateTax } from '@/lib/tax-calculator';
import type { CompanySettings, DocumentHeader, LineItem } from '@/types';

interface Props {
  document: DocumentHeader;
  lineItems: LineItem[];
  settings: CompanySettings | null;
}

const NAVY = '#1a1a2e';
const GRAY = '#6b7280';
const LIGHT = '#f4f5f7';
const BORDER = '#e2e4e9';

function fmt(n: number): string {
  return n.toLocaleString('ja-JP');
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function DocumentPreview({ document: doc, lineItems, settings }: Props) {
  const sorted = [...lineItems].sort((a, b) => a.sortOrder - b.sortOrder);
  const tax = calculateTax(sorted);
  const isCancelled = doc.status === 'cancelled';
  const isEstimate = doc.documentType === 'estimate';

  const accountTypeLabel =
    settings?.accountType === 'ordinary' ? '普通' :
    settings?.accountType === 'current'  ? '当座' :
    (settings?.accountType ?? '');

  return (
    <div style={{
      position: 'relative',
      background: '#fff',
      maxWidth: 794,
      margin: '0 auto',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif',
      fontSize: 11,
      color: NAVY,
      lineHeight: 1.65,
      boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      borderTop: `3px solid ${NAVY}`,
    }}>

      {/* 取消ウォーターマーク */}
      {isCancelled && (
        <div style={{
          position: 'absolute', top: '35%', left: '8%',
          fontSize: 88, fontWeight: 900, color: '#ef4444', opacity: 0.08,
          transform: 'rotate(-22deg)', pointerEvents: 'none',
          whiteSpace: 'nowrap', zIndex: 1, letterSpacing: 6,
        }}>取消済</div>
      )}

      <div style={{ padding: '36px 48px 44px' }}>

        {/* ── ヘッダー ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          {/* タイトル */}
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 8, color: NAVY }}>
              {isEstimate ? '見　積　書' : '請　求　書'}
            </div>
            <div style={{ marginTop: 5, fontSize: 10, color: GRAY, fontFamily: 'monospace', letterSpacing: 0.5 }}>
              No.&thinsp;{doc.documentNumber}
            </div>
          </div>

          {/* 自社情報 */}
          {settings && (
            <div style={{ textAlign: 'right', fontSize: 10.5 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{settings.companyName}</div>
              {(settings.postalCode || settings.address) && (
                <div style={{ color: GRAY }}>〒{settings.postalCode}　{settings.address}</div>
              )}
              {settings.phone && (
                <div style={{ color: GRAY }}>TEL: {settings.phone}{settings.fax ? `　FAX: ${settings.fax}` : ''}</div>
              )}
              {settings.email && <div style={{ color: GRAY }}>{settings.email}</div>}
              {settings.registrationNumber && (
                <div style={{ color: '#9ca3af', fontSize: 9, marginTop: 3 }}>登録番号: {settings.registrationNumber}</div>
              )}
            </div>
          )}
        </div>

        {/* ── 区切り線 ── */}
        <div style={{ height: 1, background: BORDER, marginBottom: 22 }} />

        {/* ── 宛先 + メタ ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 22 }}>
          {/* 宛先 */}
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ fontSize: 9, color: GRAY, letterSpacing: 1, marginBottom: 6 }}>請求先</div>
            <div style={{ fontSize: 17, fontWeight: 700, paddingBottom: 6, borderBottom: `1.5px solid ${NAVY}` }}>
              {doc.clientName}　御中
            </div>
          </div>

          {/* メタ情報 */}
          <div style={{ width: 210, flexShrink: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
              <tbody>
                <MRow label={isEstimate ? '見積書番号' : '請求書番号'} value={doc.documentNumber} mono />
                <MRow label="発行日" value={fmtDate(doc.issueDate)} />
                {isEstimate && doc.validUntil && <MRow label="有効期限" value={fmtDate(doc.validUntil)} />}
                {!isEstimate && doc.dueDate && <MRow label="支払期限" value={fmtDate(doc.dueDate)} />}
              </tbody>
            </table>
            {/* 合計金額 — 白背景・大きな数字 */}
            <div style={{ marginTop: 8, padding: '10px 12px', background: LIGHT, borderRadius: 4, borderLeft: `3px solid ${NAVY}` }}>
              <div style={{ fontSize: 9, color: GRAY, marginBottom: 2 }}>合計金額（税込）</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: NAVY }}>
                ¥&thinsp;{fmt(doc.totalAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* ── 件名 ── */}
        {doc.subject && (
          <div style={{ marginBottom: 18, fontSize: 11, color: '#374151' }}>
            <span style={{ color: GRAY, marginRight: 6 }}>件名</span>{doc.subject}
          </div>
        )}

        {/* ── 明細テーブル ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
          <thead>
            <tr style={{ background: NAVY, color: '#fff' }}>
              <th style={{ ...th, width: '5%',  textAlign: 'center' }}>No.</th>
              <th style={{ ...th, width: '34%', textAlign: 'left'   }}>品目・内容</th>
              <th style={{ ...th, width: '9%',  textAlign: 'right'  }}>数量</th>
              <th style={{ ...th, width: '7%',  textAlign: 'center' }}>単位</th>
              <th style={{ ...th, width: '16%', textAlign: 'right'  }}>単価</th>
              <th style={{ ...th, width: '10%', textAlign: 'center' }}>税率</th>
              <th style={{ ...th, width: '19%', textAlign: 'right'  }}>金額</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#d1d5db' }}>
                  明細行がありません
                </td>
              </tr>
            ) : sorted.map((item, idx) => (
              <tr key={item.SK} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ ...td, textAlign: 'center', color: GRAY }}>{idx + 1}</td>
                <td style={{ ...td }}>{item.itemName}</td>
                <td style={{ ...td, textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ ...td, textAlign: 'center', color: GRAY }}>{item.unit}</td>
                <td style={{ ...td, textAlign: 'right' }}>¥{fmt(item.unitPrice)}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{
                    fontSize: 9.5,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: item.taxRate === 8 ? '#fef3c7' : LIGHT,
                    color:      item.taxRate === 8 ? '#92400e' : GRAY,
                  }}>
                    {item.taxRate}%{item.taxRate === 8 ? '※' : ''}
                  </span>
                </td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>¥{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── 集計 ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <div style={{ width: 256, fontSize: 10.5 }}>
            <SRow label="小計（10%対象）"  value={`¥ ${fmt(tax.tax10Subtotal)}`} />
            <SRow label="消費税（10%）"    value={`¥ ${fmt(tax.tax10Amount)}`} />
            {tax.tax8Subtotal > 0 && <>
              <SRow label="小計（※8%対象）" value={`¥ ${fmt(tax.tax8Subtotal)}`} />
              <SRow label="消費税（8%）"     value={`¥ ${fmt(tax.tax8Amount)}`} />
            </>}
            {tax.taxExemptSubtotal > 0 &&
              <SRow label="非課税小計" value={`¥ ${fmt(tax.taxExemptSubtotal)}`} />}
            <SRow label="消費税合計" value={`¥ ${fmt(tax.taxAmount)}`} />

            {/* 合計 — 白背景、ボーダーで強調 */}
            <div style={{ marginTop: 6, padding: '10px 12px', borderTop: `2px solid ${NAVY}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: NAVY }}>合計（税込）</span>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: NAVY }}>
                ¥&thinsp;{fmt(tax.totalAmount)}
              </span>
            </div>
            {tax.tax8Subtotal > 0 && (
              <div style={{ textAlign: 'right', fontSize: 9, color: '#9ca3af', marginTop: 3 }}>
                ※印は軽減税率（8%）対象品目
              </div>
            )}
          </div>
        </div>

        {/* ── 振込先（請求書のみ） ── */}
        {!isEstimate && settings?.bankName && (
          <div style={{ marginTop: 22, borderTop: `1px solid ${BORDER}`, paddingTop: 14, fontSize: 10.5 }}>
            <div style={{ fontSize: 9, color: GRAY, letterSpacing: 1, marginBottom: 6 }}>お振込先</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: GRAY, minWidth: 32 }}>銀行</span>
              <span style={{ fontWeight: 600 }}>{settings.bankName}　{settings.branchName}　{accountTypeLabel}　{settings.accountNumber}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
              <span style={{ color: GRAY, minWidth: 32 }}>名義</span>
              <span>{settings.accountHolder}</span>
            </div>
          </div>
        )}

        {/* ── 備考 ── */}
        {doc.notes && (
          <div style={{ marginTop: 16, borderTop: `1px solid ${BORDER}`, paddingTop: 12, fontSize: 10.5 }}>
            <div style={{ fontSize: 9, color: GRAY, letterSpacing: 1, marginBottom: 5 }}>備考</div>
            <div style={{ color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{doc.notes}</div>
          </div>
        )}

        {/* ── フッター ── */}
        <div style={{ marginTop: 30, paddingTop: 12, borderTop: `1px solid ${BORDER}`, fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>
          {isEstimate
            ? 'この見積書は適格請求書発行事業者が発行する適格簡易請求書の要件を満たしています。'
            : 'この請求書は消費税法に基づく適格請求書（インボイス）です。'}
        </div>
      </div>
    </div>
  );
}

// ── スタイル定数 ──

const th: React.CSSProperties = { padding: '7px 8px', fontWeight: 600, fontSize: 10, letterSpacing: 0.2 };
const td: React.CSSProperties = { padding: '7px 8px', verticalAlign: 'middle' };

// ── 小コンポーネント ──

function MRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      <td style={{ padding: '4px 6px', color: GRAY, fontSize: 9.5, whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ padding: '4px 6px', fontFamily: mono ? 'monospace' : 'inherit', fontSize: 10.5 }}>{value}</td>
    </tr>
  );
}

function SRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 12px', borderBottom: `1px solid ${BORDER}`, color: '#374151' }}>
      <span style={{ color: GRAY }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
