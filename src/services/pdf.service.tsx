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
import path from 'path';
import type { DocumentHeader, LineItem, CompanySettings } from '@/types';
import { uploadDocument } from '@/lib/storage-gcs';
import { calculateTax } from '@/lib/tax-calculator';

// ─── フォント登録 ─────────────────────────────────────────────────────────────

const FONT_DIR = path.join(process.cwd(), 'pdf-templates', 'fonts');

Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: path.join(FONT_DIR, 'NotoSansJP-Regular.ttf'), fontWeight: 400 },
    { src: path.join(FONT_DIR, 'NotoSansJP-Bold.ttf'), fontWeight: 700 },
  ],
});

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

const s = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
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
  // ── ヘッダー
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: 700, letterSpacing: 5, marginTop: 2 },
  headerCompany: { alignItems: 'flex-end', maxWidth: '55%' },
  companyName: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  smallGray: { fontSize: 7.5, color: GRAY },
  // ── 帳票情報
  documentInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  clientBlock: { flex: 1, paddingRight: 20 },
  clientName: {
    fontSize: 14,
    fontWeight: 700,
    borderBottomWidth: 1,
    borderBottomColor: TEXT,
    paddingBottom: 4,
    marginBottom: 4,
  },
  metaTable: { width: 195 },
  metaRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  metaLabel: { width: 78, color: GRAY, fontSize: 8 },
  metaValue: { flex: 1 },
  metaValueBold: { flex: 1, fontWeight: 700 },
  // ── 件名
  subject: { fontSize: 10, marginBottom: 8 },
  // ── 明細テーブル
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK,
    color: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  colNo:     { width: '6%', textAlign: 'center' },
  colName:   { width: '33%' },
  colQty:    { width: '9%', textAlign: 'right' },
  colUnit:   { width: '8%', textAlign: 'center' },
  colPrice:  { width: '15%', textAlign: 'right' },
  colTax:    { width: '10%', textAlign: 'center' },
  colAmount: { width: '19%', textAlign: 'right' },
  // ── 集計
  summaryArea: { alignItems: 'flex-end', marginTop: 8 },
  taxTable: { width: 210 },
  taxRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  taxLabel: { flex: 1, color: GRAY },
  taxValue: { width: 85, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: DARK,
    color: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  totalLabel: { flex: 1 },
  totalValue: { width: 85, textAlign: 'right', fontWeight: 700 },
  reducedNote: { fontSize: 7, color: GRAY, textAlign: 'right', marginTop: 3 },
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
});

// ─── 共通コンポーネント ──────────────────────────────────────────────────────

function MetaRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={bold ? s.metaValueBold : s.metaValue}>{value}</Text>
    </View>
  );
}

function TableHeader() {
  return (
    <View style={s.tableHeader}>
      <Text style={s.colNo}>No.</Text>
      <Text style={s.colName}>品目・内容</Text>
      <Text style={s.colQty}>数量</Text>
      <Text style={s.colUnit}>単位</Text>
      <Text style={s.colPrice}>単価</Text>
      <Text style={s.colTax}>税率</Text>
      <Text style={s.colAmount}>金額</Text>
    </View>
  );
}

function TableRows({ items }: { items: PdfTemplateData['lineItems'] }) {
  return (
    <>
      {items.map((item) => (
        <View key={item.index} style={s.tableRow}>
          <Text style={s.colNo}>{item.index}</Text>
          <Text style={s.colName}>{item.itemName}</Text>
          <Text style={s.colQty}>{item.quantity}</Text>
          <Text style={s.colUnit}>{item.unit}</Text>
          <Text style={s.colPrice}>{item.unitPrice}</Text>
          <Text style={s.colTax}>{item.taxRate}%{item.isReducedTax ? '※' : ''}</Text>
          <Text style={s.colAmount}>{item.amount}</Text>
        </View>
      ))}
    </>
  );
}

function TaxSummary({ data }: { data: PdfTemplateData }) {
  return (
    <View style={s.summaryArea}>
      <View style={s.taxTable}>
        <View style={s.taxRow}>
          <Text style={s.taxLabel}>小計（10%対象）</Text>
          <Text style={s.taxValue}>{data.tax10Subtotal} 円</Text>
        </View>
        <View style={s.taxRow}>
          <Text style={s.taxLabel}>消費税（10%）</Text>
          <Text style={s.taxValue}>{data.tax10Amount} 円</Text>
        </View>
        {data.hasTax8 && (
          <>
            <View style={s.taxRow}>
              <Text style={s.taxLabel}>小計（※8%対象）</Text>
              <Text style={s.taxValue}>{data.tax8Subtotal} 円</Text>
            </View>
            <View style={s.taxRow}>
              <Text style={s.taxLabel}>消費税（8%）</Text>
              <Text style={s.taxValue}>{data.tax8Amount} 円</Text>
            </View>
          </>
        )}
        {data.hasTaxExempt && (
          <View style={s.taxRow}>
            <Text style={s.taxLabel}>非課税小計</Text>
            <Text style={s.taxValue}>{data.taxExemptSubtotal} 円</Text>
          </View>
        )}
        <View style={s.taxRow}>
          <Text style={s.taxLabel}>消費税合計</Text>
          <Text style={s.taxValue}>{data.taxAmount} 円</Text>
        </View>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>合計（税込）</Text>
          <Text style={s.totalValue}>{data.totalAmount} 円</Text>
        </View>
      </View>
      {data.hasTax8 && (
        <Text style={s.reducedNote}>※印は軽減税率（8%）対象品目</Text>
      )}
    </View>
  );
}

function CompanyBlock({ data }: { data: PdfTemplateData }) {
  return (
    <View style={s.headerCompany}>
      <Text style={s.companyName}>{data.companyName}</Text>
      {(data.companyPostalCode || data.companyAddress) && (
        <Text>〒{data.companyPostalCode} {data.companyAddress}</Text>
      )}
      {data.companyPhone && (
        <Text>TEL: {data.companyPhone}{data.companyFax ? ` / FAX: ${data.companyFax}` : ''}</Text>
      )}
      {data.companyEmail && <Text>{data.companyEmail}</Text>}
      {data.registrationNumber && (
        <Text style={s.smallGray}>適格請求書発行事業者登録番号: {data.registrationNumber}</Text>
      )}
    </View>
  );
}

function ClientBlock({ data }: { data: PdfTemplateData }) {
  return (
    <View style={s.clientBlock}>
      <Text style={s.clientName}>{data.clientName} 御中</Text>
      {data.clientPostalCode && <Text>〒{data.clientPostalCode}</Text>}
      {data.clientAddress && <Text>{data.clientAddress}</Text>}
      {data.clientRegistrationNumber && (
        <Text style={s.smallGray}>登録番号: {data.clientRegistrationNumber}</Text>
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

        {/* ヘッダー */}
        <View style={s.header}>
          <Text style={s.headerTitle}>請　求　書</Text>
          <CompanyBlock data={data} />
        </View>

        {/* 帳票情報 */}
        <View style={s.documentInfo}>
          <ClientBlock data={data} />
          <View style={s.metaTable}>
            <MetaRow label="請求書番号" value={data.documentNumber} />
            <MetaRow label="発行日" value={data.issueDate} />
            {data.dueDate && <MetaRow label="支払期限" value={data.dueDate} bold />}
            <MetaRow label="合計金額" value={`${data.totalAmount} 円`} bold />
            {data.sourceEstimateNumber && (
              <MetaRow label="見積書番号" value={data.sourceEstimateNumber} />
            )}
          </View>
        </View>

        {data.subject && <Text style={s.subject}>件名: {data.subject}</Text>}

        {/* 明細 */}
        <TableHeader />
        <TableRows items={data.lineItems} />

        {/* 集計 */}
        <TaxSummary data={data} />

        {/* 振込先 */}
        {data.bankName && (
          <View style={s.bankBox}>
            <Text style={s.boxTitle}>お振込先</Text>
            <Text>{data.bankName} {data.branchName}</Text>
            <Text>{data.accountType}　{data.accountNumber}</Text>
            <Text>口座名義: {data.accountHolder}</Text>
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

        {/* ヘッダー */}
        <View style={s.header}>
          <Text style={s.headerTitle}>見　積　書</Text>
          <CompanyBlock data={data} />
        </View>

        {/* 帳票情報 */}
        <View style={s.documentInfo}>
          <ClientBlock data={data} />
          <View style={s.metaTable}>
            <MetaRow label="見積書番号" value={data.documentNumber} />
            <MetaRow label="発行日" value={data.issueDate} />
            {data.validUntil && <MetaRow label="有効期限" value={data.validUntil} />}
            <MetaRow label="合計金額" value={`${data.totalAmount} 円`} bold />
          </View>
        </View>

        {data.subject && <Text style={s.subject}>件名: {data.subject}</Text>}

        {/* 明細 */}
        <TableHeader />
        <TableRows items={data.lineItems} />

        {/* 集計 */}
        <TaxSummary data={data} />

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
