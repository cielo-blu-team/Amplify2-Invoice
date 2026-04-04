import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer';
import { existsSync } from 'fs';
import type { DocumentHeader, LineItem, CompanySettings } from '@/types';
import { uploadDocument } from '@/lib/storage-gcs';
import { calculateTax } from '@/lib/tax-calculator';

// ─── フォント登録（遅延初期化） ───────────────────────────────────────────────

// Cloud Run (Linux): fonts-ipafont-gothic でインストールされるパス候補
const IPA_FONT_CANDIDATES = [
  '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf',
  '/usr/share/fonts/truetype/ipafont-gothic/ipag.ttf',
  '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf',
];

// 開発環境フォールバック（CDN）
const FALLBACK_FONT_URL =
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.2.9/files/noto-sans-jp-119-400-normal.woff';

let fontRegistered = false;

function ensureFonts() {
  if (fontRegistered) return;
  const src = IPA_FONT_CANDIDATES.find(existsSync) ?? FALLBACK_FONT_URL;
  Font.register({ family: 'Japanese', src });
  fontRegistered = true;
}

// ─── テンプレートデータ型 ────────────────────────────────────────────────────

interface PdfTemplateData {
  documentType: 'invoice' | 'estimate';
  documentNumber: string;
  issueDate: string;
  validUntil?: string;
  dueDate?: string;
  subject?: string;
  sourceEstimateNumber?: string;

  clientName: string;
  clientPostalCode?: string;
  clientAddress?: string;
  clientRegistrationNumber?: string;

  companyName: string;
  representativeName?: string;
  companyPostalCode?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyFax?: string;
  companyEmail?: string;
  registrationNumber?: string;

  bankName?: string;
  branchName?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;

  lineItems: Array<{
    index: number;
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: string;
    taxRate: number;
    isReducedTax: boolean;
    amount: string;
  }>;

  tax10Subtotal: string;
  tax10Amount: string;
  tax8Subtotal: string;
  tax8Amount: string;
  taxExemptSubtotal: string;
  taxAmount: string;
  totalAmount: string;
  totalAmountRaw: number;
  hasTax8: boolean;
  hasTaxExempt: boolean;

  notes?: string;
  isCancelled: boolean;
}

// ─── スタイル ────────────────────────────────────────────────────────────────

const DARK = '#1a1a2e';
const TEXT = '#0f0f1a';
const GRAY = '#71717a';
const BORDER = '#d1d5db';
const HEADER_BG = '#333333';

const s = StyleSheet.create({
  page: {
    fontFamily: 'Japanese',
    fontSize: 9,
    color: TEXT,
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 38,
    paddingRight: 38,
    lineHeight: 1.4,
  },
  watermark: {
    position: 'absolute',
    top: '38%',
    left: '12%',
    fontSize: 72,
    fontWeight: 700,
    color: '#ef4444',
    opacity: 0.15,
  },

  // ── 右上 日付・番号
  topRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    gap: 16,
  },
  topRightText: { fontSize: 9 },

  // ── タイトル（中央）
  titleRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 8,
  },

  // ── 取引先 + 自社情報
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clientBlock: {
    flex: 1,
    paddingRight: 20,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 700,
    borderBottomWidth: 1,
    borderBottomColor: TEXT,
    paddingBottom: 4,
    marginBottom: 4,
  },
  companyBlock: {
    width: 200,
    alignItems: 'flex-end',
  },
  companyName: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  companyText: { fontSize: 8, textAlign: 'right' },
  registrationText: { fontSize: 8, textAlign: 'right', marginBottom: 2 },

  // ── 件名・挨拶
  subject: { fontSize: 9, marginBottom: 2 },
  greeting: { fontSize: 9, marginBottom: 10 },

  // ── ご請求金額 / ご見積金額
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: TEXT,
    paddingBottom: 4,
    width: '55%',
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: 700,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 700,
    marginLeft: 12,
  },

  // ── 支払期限 / 有効期限
  deadlineRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 8,
  },
  deadlineLabel: { fontSize: 9 },
  deadlineValue: { fontSize: 9, fontWeight: 700 },

  // ── 明細テーブル（4列: 品目・数量・単価・金額）
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: HEADER_BG,
    color: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  colName:   { width: '52%' },
  colQty:    { width: '12%', textAlign: 'right' },
  colPrice:  { width: '16%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },

  // ── 集計（右寄せ）
  summaryArea: { alignItems: 'flex-end', marginTop: 6 },
  summaryTable: { width: 220 },
  summaryRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  summaryLabel: { flex: 1, fontSize: 9 },
  summaryValue: { width: 90, textAlign: 'right', fontSize: 9 },
  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  totalLabel: { flex: 1, fontSize: 10, fontWeight: 700 },
  totalValue: { width: 90, textAlign: 'right', fontSize: 10, fontWeight: 700 },

  // ── 税区分表（横並び）
  taxBreakdownBox: {
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  taxBreakdownRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  taxBreakdownCell: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 8,
    textAlign: 'right',
  },
  taxBreakdownLabel: {
    width: 70,
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 8,
    backgroundColor: '#f0f0f0',
    fontWeight: 700,
  },
  taxBreakdownHeader: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 8,
    fontWeight: 700,
    textAlign: 'right',
  },

  // ── 振込先
  bankBox: {
    marginTop: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 8,
  },
  boxTitle: {
    fontWeight: 700,
    fontSize: 9,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingBottom: 3,
  },
  // ── 備考
  notesBox: {
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 8,
  },
  // ── フッター
  footer: { marginTop: 14, fontSize: 7, color: GRAY, textAlign: 'center' },
  smallGray: { fontSize: 7.5, color: GRAY },
});

// ─── 共通コンポーネント ──────────────────────────────────────────────────────

function TopRight({ data }: { data: PdfTemplateData }) {
  return (
    <View style={s.topRight}>
      <Text style={s.topRightText}>{data.issueDate}</Text>
      <Text style={s.topRightText}>{data.documentNumber}</Text>
    </View>
  );
}

function Title({ text }: { text: string }) {
  return (
    <View style={s.titleRow}>
      <Text style={s.title}>{text}</Text>
    </View>
  );
}

function ClientBlock({ data }: { data: PdfTemplateData }) {
  return (
    <View style={s.clientBlock}>
      <Text style={s.clientName}>{data.clientName}　御中</Text>
      {data.clientPostalCode && <Text style={{ fontSize: 8 }}>〒{data.clientPostalCode}</Text>}
      {data.clientAddress && <Text style={{ fontSize: 8 }}>{data.clientAddress}</Text>}
      {data.clientRegistrationNumber && (
        <Text style={s.smallGray}>登録番号: {data.clientRegistrationNumber}</Text>
      )}
    </View>
  );
}

function CompanyBlock({ data }: { data: PdfTemplateData }) {
  return (
    <View style={s.companyBlock}>
      {data.registrationNumber && (
        <Text style={s.registrationText}>{data.registrationNumber}</Text>
      )}
      <Text style={s.companyName}>{data.companyName}</Text>
      {data.representativeName && (
        <Text style={s.companyText}>{data.representativeName}</Text>
      )}
      {data.companyPostalCode && (
        <Text style={s.companyText}>〒{data.companyPostalCode}</Text>
      )}
      {data.companyAddress && (
        <Text style={s.companyText}>{data.companyAddress}</Text>
      )}
      {data.companyPhone && (
        <Text style={s.companyText}>
          TEL: {data.companyPhone}{data.companyFax ? ` / FAX: ${data.companyFax}` : ''}
        </Text>
      )}
    </View>
  );
}

function TableHeader4Col() {
  return (
    <View style={s.tableHeader}>
      <Text style={s.colName}>品目</Text>
      <Text style={s.colQty}>数量</Text>
      <Text style={s.colPrice}>単価</Text>
      <Text style={s.colAmount}>金額</Text>
    </View>
  );
}

function TableRows({ items }: { items: PdfTemplateData['lineItems'] }) {
  return (
    <>
      {items.map((item) => (
        <View key={item.index} style={s.tableRow}>
          <Text style={s.colName}>
            {item.itemName}{item.isReducedTax ? ' ※' : ''}
          </Text>
          <Text style={s.colQty}>{item.quantity}</Text>
          <Text style={s.colPrice}>{item.unitPrice}</Text>
          <Text style={s.colAmount}>{item.amount}</Text>
        </View>
      ))}
    </>
  );
}

function SummaryBlock({ data }: { data: PdfTemplateData }) {
  return (
    <View style={s.summaryArea}>
      <View style={s.summaryTable}>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>小計</Text>
          <Text style={s.summaryValue}>{data.tax10Subtotal}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>消費税(10%)</Text>
          <Text style={s.summaryValue}>{data.tax10Amount}</Text>
        </View>
        {data.hasTax8 && (
          <>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>小計(※8%)</Text>
              <Text style={s.summaryValue}>{data.tax8Subtotal}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>消費税(8%)</Text>
              <Text style={s.summaryValue}>{data.tax8Amount}</Text>
            </View>
          </>
        )}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>合計</Text>
          <Text style={s.totalValue}>{data.totalAmount}</Text>
        </View>
      </View>
    </View>
  );
}

function TaxBreakdownTable({ data }: { data: PdfTemplateData }) {
  return (
    <View style={s.summaryArea}>
      <View style={[s.taxBreakdownBox, { width: 320 }]}>
        {/* ヘッダー行 */}
        <View style={[s.taxBreakdownRow, { borderBottomWidth: 0.5 }]}>
          <Text style={s.taxBreakdownLabel}></Text>
          <Text style={s.taxBreakdownHeader}>対象額</Text>
          <Text style={s.taxBreakdownHeader}>消費税</Text>
        </View>
        {/* 10%行 */}
        <View style={s.taxBreakdownRow}>
          <Text style={s.taxBreakdownLabel}>10%対象</Text>
          <Text style={s.taxBreakdownCell}>{data.tax10Subtotal}</Text>
          <Text style={s.taxBreakdownCell}>{data.tax10Amount}</Text>
        </View>
        {/* 8%行 */}
        <View style={[s.taxBreakdownRow, { borderBottomWidth: 0 }]}>
          <Text style={s.taxBreakdownLabel}>8%対象</Text>
          <Text style={s.taxBreakdownCell}>{data.hasTax8 ? data.tax8Subtotal : '0'}</Text>
          <Text style={s.taxBreakdownCell}>{data.hasTax8 ? data.tax8Amount : '0'}</Text>
        </View>
      </View>
      {data.hasTax8 && (
        <Text style={{ fontSize: 7, color: GRAY, textAlign: 'right', marginTop: 2 }}>
          ※印は軽減税率（8%）対象品目
        </Text>
      )}
    </View>
  );
}

// ─── 請求書 PDF ──────────────────────────────────────────────────────────────

function InvoicePdf({ data }: { data: PdfTemplateData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {data.isCancelled && <Text style={s.watermark}>取消済</Text>}

        {/* 右上: 日付・番号 */}
        <TopRight data={data} />

        {/* タイトル */}
        <Title text="請　求　書" />

        {/* 取引先 + 自社情報 */}
        <View style={s.infoRow}>
          <ClientBlock data={data} />
          <CompanyBlock data={data} />
        </View>

        {/* 件名 */}
        {data.subject && <Text style={s.subject}>件名: {data.subject}</Text>}
        <Text style={s.greeting}>下記の通りご請求申し上げます</Text>

        {/* ご請求金額 */}
        <View style={s.amountRow}>
          <Text style={s.amountLabel}>ご請求金額</Text>
          <Text style={s.amountValue}>¥{data.totalAmount}</Text>
        </View>

        {/* 支払期限 */}
        {data.dueDate && (
          <View style={s.deadlineRow}>
            <Text style={s.deadlineLabel}>お支払い期限</Text>
            <Text style={s.deadlineValue}>{data.dueDate}</Text>
          </View>
        )}

        {/* 明細テーブル */}
        <TableHeader4Col />
        <TableRows items={data.lineItems} />

        {/* 集計 */}
        <SummaryBlock data={data} />

        {/* 税区分表 */}
        <TaxBreakdownTable data={data} />

        {/* 振込先 */}
        {data.bankName && (
          <View style={s.bankBox}>
            <Text style={s.boxTitle}>振込先</Text>
            <Text>{data.bankName} {data.branchName}</Text>
            <Text>{data.accountType}　{data.accountNumber}</Text>
            <Text>{data.accountHolder}</Text>
          </View>
        )}

        {/* 備考 */}
        {data.notes && (
          <View style={s.notesBox}>
            <Text style={s.boxTitle}>備考</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        <Text style={s.footer}>
          この請求書は消費税法に基づく適格請求書（インボイス）です。
        </Text>
      </Page>
    </Document>
  );
}

// ─── 見積書 PDF ──────────────────────────────────────────────────────────────

function EstimatePdf({ data }: { data: PdfTemplateData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {data.isCancelled && <Text style={s.watermark}>取消済</Text>}

        {/* 右上: 日付・番号 */}
        <TopRight data={data} />

        {/* タイトル */}
        <Title text="見　積　書" />

        {/* 取引先 + 自社情報 */}
        <View style={s.infoRow}>
          <ClientBlock data={data} />
          <CompanyBlock data={data} />
        </View>

        {/* 件名 */}
        {data.subject && <Text style={s.subject}>件名: {data.subject}</Text>}
        <Text style={s.greeting}>下記の通りお見積り申し上げます</Text>

        {/* ご見積金額 */}
        <View style={s.amountRow}>
          <Text style={s.amountLabel}>ご見積金額</Text>
          <Text style={s.amountValue}>¥{data.totalAmount}</Text>
        </View>

        {/* 有効期限 */}
        {data.validUntil && (
          <View style={s.deadlineRow}>
            <Text style={s.deadlineLabel}>有効期限</Text>
            <Text style={s.deadlineValue}>{data.validUntil}</Text>
          </View>
        )}

        {/* 明細テーブル */}
        <TableHeader4Col />
        <TableRows items={data.lineItems} />

        {/* 集計 */}
        <SummaryBlock data={data} />

        {/* 税区分表 */}
        <TaxBreakdownTable data={data} />

        {/* 備考 */}
        {data.notes && (
          <View style={s.notesBox}>
            <Text style={s.boxTitle}>備考</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        <Text style={s.footer}>
          この見積書は適格請求書発行事業者が発行する適格簡易請求書の要件を満たしています。
        </Text>
      </Page>
    </Document>
  );
}

// ─── ヘルパー ────────────────────────────────────────────────────────────────

function toJPY(amount: number): string {
  return amount.toLocaleString('ja-JP');
}

function buildTemplateData(
  doc: DocumentHeader,
  lineItems: LineItem[],
  settings: CompanySettings,
  isCancelled = false,
): PdfTemplateData {
  const tax = calculateTax(lineItems);

  const formattedLineItems = lineItems
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, idx) => ({
      index: idx + 1,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: toJPY(item.unitPrice),
      taxRate: item.taxRate,
      isReducedTax: item.taxRate === 8,
      amount: toJPY(item.amount),
    }));

  const accountTypeLabel =
    settings.accountType === 'ordinary'
      ? '普通'
      : settings.accountType === 'current'
        ? '当座'
        : settings.accountType;

  return {
    documentType: doc.documentType as 'invoice' | 'estimate',
    documentNumber: doc.documentNumber,
    issueDate: doc.issueDate,
    validUntil: doc.validUntil,
    dueDate: doc.dueDate,
    subject: doc.subject,

    clientName: doc.clientName,

    companyName: settings.companyName,
    representativeName: settings.representativeName,
    companyPostalCode: settings.postalCode,
    companyAddress: settings.address,
    companyPhone: settings.phone,
    companyFax: settings.fax,
    companyEmail: settings.email,
    registrationNumber: settings.registrationNumber,

    bankName: settings.bankName,
    branchName: settings.branchName,
    accountType: accountTypeLabel,
    accountNumber: settings.accountNumber,
    accountHolder: settings.accountHolder,

    lineItems: formattedLineItems,

    tax10Subtotal: toJPY(tax.tax10Subtotal),
    tax10Amount: toJPY(tax.tax10Amount),
    tax8Subtotal: toJPY(tax.tax8Subtotal),
    tax8Amount: toJPY(tax.tax8Amount),
    taxExemptSubtotal: toJPY(tax.taxExemptSubtotal),
    taxAmount: toJPY(tax.taxAmount),
    totalAmount: toJPY(tax.totalAmount),
    totalAmountRaw: tax.totalAmount,
    hasTax8: tax.tax8Subtotal > 0,
    hasTaxExempt: tax.taxExemptSubtotal > 0,

    notes: doc.notes,
    isCancelled,
  };
}

// ─── PDF 生成・アップロード ───────────────────────────────────────────────────

export async function generatePdf(params: {
  doc: DocumentHeader;
  lineItems: LineItem[];
  settings: CompanySettings;
  cancelled?: boolean;
}): Promise<string> {
  const { doc, lineItems, settings, cancelled = false } = params;

  ensureFonts();
  const data = buildTemplateData(doc, lineItems, settings, cancelled);

  const element =
    data.documentType === 'invoice'
      ? React.createElement(InvoicePdf, { data })
      : React.createElement(EstimatePdf, { data });

  const pdfBuffer = await renderToBuffer(element);

  const s3Key = `${doc.documentId}/${doc.documentNumber}.pdf`;
  const fullKey = await uploadDocument(s3Key, Buffer.from(pdfBuffer), 'application/pdf');

  return fullKey;
}

export async function generateCancelledPdf(params: {
  doc: DocumentHeader;
  lineItems: LineItem[];
  settings: CompanySettings;
}): Promise<string> {
  return generatePdf({ ...params, cancelled: true });
}
