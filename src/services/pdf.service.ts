import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import type { DocumentHeader, LineItem, CompanySettings } from '@/types';
import { uploadDocument } from '@/lib/s3';
import { calculateTax } from '@/lib/tax-calculator';

// ─── テンプレートデータ型 ────────────────────────────────────────────────────

interface PdfTemplateData {
  // 帳票情報
  documentNumber: string;
  issueDate: string;
  validUntil?: string;
  dueDate?: string;
  subject?: string;
  sourceEstimateNumber?: string;

  // 取引先
  clientName: string;
  clientPostalCode?: string;
  clientAddress?: string;
  clientRegistrationNumber?: string;

  // 自社情報
  companyName: string;
  companyPostalCode?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyFax?: string;
  companyEmail?: string;
  registrationNumber?: string;
  logoUrl?: string;
  sealUrl?: string;

  // 振込先（請求書のみ）
  bankName?: string;
  branchName?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;

  // 明細行
  lineItems: Array<{
    index: number;
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: string; // 金額フォーマット済み
    taxRate: number;
    isReducedTax: boolean;
    amount: string; // 金額フォーマット済み
  }>;

  // 税率別内訳
  tax10Subtotal: string;
  tax10Amount: string;
  tax8Subtotal: string;
  tax8Amount: string;
  taxExemptSubtotal: string;
  taxAmount: string;
  totalAmount: string;
  hasTax8: boolean;
  hasTaxExempt: boolean;

  // 備考
  notes?: string;

  // 取消フラグ
  isCancelled: boolean;
}

// ─── ヘルパー ────────────────────────────────────────────────────────────────

function toJPY(amount: number): string {
  return amount.toLocaleString('ja-JP');
}

// ─── テンプレートレンダリング ────────────────────────────────────────────────

/**
 * Mustache 風プレースホルダーを data で置換する。
 * - `{{#key}}...{{/key}}` ブロック: key が truthy なら表示、falsy なら非表示。
 *   値が配列の場合は各要素で繰り返しレンダリング。
 * - `{{key}}` 変数: 対応する値に置換。undefined/null は空文字。
 */
function renderTemplate(template: string, data: Record<string, unknown>): string {
  // まず {{#key}}...{{/key}} ブロックを処理
  let result = template.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key: string, content: string) => {
      const value = data[key];
      if (!value) return '';
      if (Array.isArray(value)) {
        return value
          .map((item) => renderTemplate(content, item as Record<string, unknown>))
          .join('');
      }
      return renderTemplate(content, data);
    },
  );

  // 次に {{変数名}} を置換
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = data[key];
    return value !== undefined && value !== null ? String(value) : '';
  });

  return result;
}

// ─── テンプレートデータ構築 ──────────────────────────────────────────────────

/**
 * DocumentHeader・LineItem[] と CompanySettings から PdfTemplateData を組み立てる。
 */
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
    settings.accountType === 'ordinary' ? '普通' : settings.accountType === 'current' ? '当座' : settings.accountType;

  return {
    // 帳票情報
    documentNumber: doc.documentNumber,
    issueDate: doc.issueDate,
    validUntil: doc.validUntil,
    dueDate: doc.dueDate,
    subject: doc.subject,

    // 取引先
    clientName: doc.clientName,

    // 自社情報
    companyName: settings.companyName,
    companyPostalCode: settings.postalCode,
    companyAddress: settings.address,
    companyPhone: settings.phone,
    companyFax: settings.fax,
    companyEmail: settings.email,
    registrationNumber: settings.registrationNumber,
    logoUrl: settings.logoUrl,
    sealUrl: settings.sealUrl,

    // 振込先（請求書のみ）
    bankName: settings.bankName,
    branchName: settings.branchName,
    accountType: accountTypeLabel,
    accountNumber: settings.accountNumber,
    accountHolder: settings.accountHolder,

    // 明細行
    lineItems: formattedLineItems,

    // 税率別内訳
    tax10Subtotal: toJPY(tax.tax10Subtotal),
    tax10Amount: toJPY(tax.tax10Amount),
    tax8Subtotal: toJPY(tax.tax8Subtotal),
    tax8Amount: toJPY(tax.tax8Amount),
    taxExemptSubtotal: toJPY(tax.taxExemptSubtotal),
    taxAmount: toJPY(tax.taxAmount),
    totalAmount: toJPY(tax.totalAmount),
    hasTax8: tax.tax8Subtotal > 0,
    hasTaxExempt: tax.taxExemptSubtotal > 0,

    // 備考
    notes: doc.notes,

    // 取消フラグ
    isCancelled,
  };
}

// ─── PDF 生成 ────────────────────────────────────────────────────────────────

/**
 * 帳票 PDF を生成し S3 にアップロードする。
 * @returns アップロードされた S3 フルキー
 */
export async function generatePdf(params: {
  doc: DocumentHeader;
  lineItems: LineItem[];
  settings: CompanySettings;
  cancelled?: boolean;
}): Promise<string> {
  const { doc, lineItems, settings, cancelled = false } = params;

  // テンプレートファイル選択
  const templateFileName = doc.documentType === 'invoice' ? 'invoice.html' : 'estimate.html';
  const templatePath = path.join(process.cwd(), 'pdf-templates', templateFileName);

  // テンプレート読み込み
  const templateSource = await fs.readFile(templatePath, 'utf-8');

  // データ変換
  const templateData = buildTemplateData(doc, lineItems, settings, cancelled);

  // HTML レンダリング
  const html = renderTemplate(templateSource, templateData as unknown as Record<string, unknown>);

  // Puppeteer で HTML → PDF 変換
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let pdfBuffer: Uint8Array;
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '20mm', right: '20mm' },
    });
  } finally {
    await browser.close();
  }

  // S3 アップロード（key: {documentId}/{documentNumber}.pdf）
  const s3Key = `${doc.documentId}/${doc.documentNumber}.pdf`;
  const fullKey = await uploadDocument(s3Key, pdfBuffer, 'application/pdf');

  return fullKey;
}

/**
 * 取消透かし付き PDF を生成し S3 にアップロードする。
 * @returns アップロードされた S3 フルキー
 */
export async function generateCancelledPdf(params: {
  doc: DocumentHeader;
  lineItems: LineItem[];
  settings: CompanySettings;
}): Promise<string> {
  return generatePdf({ ...params, cancelled: true });
}
