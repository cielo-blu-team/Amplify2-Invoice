/**
 * MCP ツール実装（サービス層を直接呼び出す）
 * SSE エンドポイントおよび Slack ブリッジ REST エンドポイントで共用
 */
import { z } from 'zod';
import * as documentService from '@/services/document.service';
import * as documentRepo from '@/repositories/document.repository';
import * as clientService from '@/services/client.service';
import * as approvalService from '@/services/approval.service';
import type { LineItemInput, DocumentListFilters } from '@/types/document';
import { authorize } from '@/lib/auth';
import type { Role } from '@/types/user';

// MCP_SYSTEM_ROLE 環境変数でロールを制御（デフォルト: admin）
function getMcpRole(): Role {
  const r = process.env.MCP_SYSTEM_ROLE;
  if (r === 'user' || r === 'accountant' || r === 'admin') return r;
  return 'admin';
}

// ────────────────────────────────────────────────────────────────
// スキーマ定義
// ────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  taxRate: z.union([z.literal(10), z.literal(8), z.literal(0)]),
});

export const createEstimateSchema = z.object({
  clientName: z.string().describe('取引先名（部分一致で自動解決）'),
  subject: z.string().describe('件名'),
  issueDate: z.string().describe('発行日 YYYY-MM-DD'),
  validUntil: z.string().optional().describe('有効期限 YYYY-MM-DD'),
  lineItems: z.array(lineItemSchema).describe('明細行'),
  notes: z.string().optional().describe('備考'),
});

export const createInvoiceSchema = z.object({
  clientName: z.string().describe('取引先名（部分一致で自動解決）'),
  subject: z.string().describe('件名'),
  issueDate: z.string().describe('発行日 YYYY-MM-DD'),
  dueDate: z.string().describe('支払期限 YYYY-MM-DD'),
  lineItems: z.array(lineItemSchema).describe('明細行'),
  notes: z.string().optional().describe('備考'),
});

export const convertToInvoiceSchema = z.object({
  documentId: z.string().describe('見積書ID'),
  dueDate: z.string().describe('支払期限 YYYY-MM-DD'),
});

export const getDocumentSchema = z.object({
  documentId: z.string().describe('帳票ID'),
});

export const listDocumentsSchema = z.object({
  documentType: z.enum(['estimate', 'invoice']).optional().describe('帳票種別フィルタ'),
  status: z.string().optional().describe('ステータスフィルタ（カンマ区切りで複数指定可）'),
  clientName: z.string().optional().describe('取引先名フィルタ（部分一致）'),
  fromDate: z.string().optional().describe('発行日From YYYY-MM-DD'),
  toDate: z.string().optional().describe('発行日To YYYY-MM-DD'),
  limit: z.number().int().positive().max(100).optional().describe('取得件数（最大100）'),
  cursor: z.string().optional().describe('ページネーションカーソル'),
});

export const updateDocumentSchema = z.object({
  documentId: z.string().describe('帳票ID'),
  subject: z.string().optional().describe('件名'),
  issueDate: z.string().optional().describe('発行日 YYYY-MM-DD'),
  validUntil: z.string().optional().describe('有効期限 YYYY-MM-DD'),
  dueDate: z.string().optional().describe('支払期限 YYYY-MM-DD'),
  notes: z.string().optional().describe('備考'),
  lineItems: z.array(lineItemSchema).optional().describe('明細行'),
});

export const deleteDocumentSchema = z.object({
  documentId: z.string().describe('帳票ID'),
});

export const generatePdfSchema = z.object({
  documentId: z.string().describe('帳票ID'),
});

export const updateStatusSchema = z.object({
  documentId: z.string().describe('帳票ID'),
  newStatus: z.enum([
    'draft', 'pending_approval', 'approved', 'rejected',
    'confirmed', 'sent', 'paid', 'cancelled',
  ]).describe('新しいステータス'),
  comment: z.string().optional().describe('ステータス変更コメント'),
});

export const approveDocumentSchema = z.object({
  documentId: z.string().describe('帳票ID'),
  action: z.enum(['approve', 'reject']).describe('承認アクション'),
  comment: z.string().optional().describe('承認・否認コメント（否認時は必須）'),
});

export const listClientsSchema = z.object({
  name: z.string().optional().describe('取引先名フィルタ（部分一致）'),
  limit: z.number().int().positive().max(100).optional().describe('取得件数（最大100）'),
  cursor: z.string().optional().describe('ページネーションカーソル'),
});

export const createClientSchema = z.object({
  clientName: z.string().describe('取引先名'),
  email: z.string().optional().describe('メールアドレス'),
  phone: z.string().optional().describe('電話番号'),
  address: z.string().optional().describe('住所'),
  contactPerson: z.string().optional().describe('担当者名'),
});

export const updateClientSchema = z.object({
  clientId: z.string().describe('取引先ID'),
  clientName: z.string().optional().describe('取引先名'),
  email: z.string().optional().describe('メールアドレス'),
  phone: z.string().optional().describe('電話番号'),
  address: z.string().optional().describe('住所'),
  contactPerson: z.string().optional().describe('担当者名'),
});

export const getDashboardSchema = z.object({
  fromDate: z.string().optional().describe('集計開始日 YYYY-MM-DD'),
  toDate: z.string().optional().describe('集計終了日 YYYY-MM-DD'),
});

// ────────────────────────────────────────────────────────────────
// ヘルパー
// ────────────────────────────────────────────────────────────────

/**
 * 取引先名からクライアントIDを解決。見つからなければ自動作成。
 */
async function resolveClientId(clientName: string, _createdBy: string): Promise<{ clientId: string; clientName: string }> {
  const result = await clientService.searchClients(clientName, 1);
  if (result.items.length > 0) {
    const c = result.items[0];
    return { clientId: c.clientId, clientName: c.clientName };
  }
  // 見つからなければ自動作成
  const newClient = await clientService.createClient({ clientName, businessType: 'other' });
  return { clientId: newClient.clientId, clientName: newClient.clientName };
}

function toLineItems(lineItems: Array<{ description: string; quantity: number; unitPrice: number; taxRate: number }>): LineItemInput[] {
  return lineItems.map((item, i) => ({
    itemName: item.description,
    quantity: item.quantity,
    unit: '式',
    unitPrice: item.unitPrice,
    taxRate: item.taxRate as 0 | 8 | 10,
    sortOrder: i + 1,
  }));
}

// ────────────────────────────────────────────────────────────────
// ツール実装
// ────────────────────────────────────────────────────────────────

export async function createEstimate(args: z.infer<typeof createEstimateSchema>, userId: string) {
  authorize(getMcpRole(), 'document:create');
  const { clientId, clientName } = await resolveClientId(args.clientName, userId);
  const today = new Date().toISOString().slice(0, 10);
  return documentService.createDocument({
    documentType: 'estimate',
    clientId,
    clientName,
    subject: args.subject,
    issueDate: args.issueDate ?? today,
    ...(args.validUntil && { validUntil: args.validUntil }),
    ...(args.notes && { notes: args.notes }),
    items: toLineItems(args.lineItems),
    createdBy: userId,
  });
}

export async function createInvoice(args: z.infer<typeof createInvoiceSchema>, userId: string) {
  authorize(getMcpRole(), 'document:create');
  const { clientId, clientName } = await resolveClientId(args.clientName, userId);
  const today = new Date().toISOString().slice(0, 10);
  return documentService.createDocument({
    documentType: 'invoice',
    clientId,
    clientName,
    subject: args.subject,
    issueDate: args.issueDate ?? today,
    dueDate: args.dueDate,
    ...(args.notes && { notes: args.notes }),
    items: toLineItems(args.lineItems),
    createdBy: userId,
  });
}

export async function convertToInvoice(args: z.infer<typeof convertToInvoiceSchema>, userId: string) {
  authorize(getMcpRole(), 'document:create');
  return documentService.convertToInvoice(args.documentId, { dueDate: args.dueDate, createdBy: userId });
}

export async function getDocument(args: z.infer<typeof getDocumentSchema>) {
  authorize(getMcpRole(), 'document:read');
  const doc = await documentService.getDocument(args.documentId);
  if (!doc) throw new Error(`帳票が見つかりません: ${args.documentId}`);
  const lineItems = await documentRepo.getDocumentLineItems(args.documentId);
  return { ...doc, lineItems };
}

export async function listDocuments(args: z.infer<typeof listDocumentsSchema>) {
  authorize(getMcpRole(), 'document:read');
  const filters: DocumentListFilters = {
    ...(args.documentType && { documentType: args.documentType }),
    ...(args.status && { status: args.status.split(',').map(s => s.trim()) as import('@/types/document').DocumentStatus[] }),
    ...(args.clientName && { clientName: args.clientName }),
    ...(args.fromDate && { issueDateFrom: args.fromDate }),
    ...(args.toDate && { issueDateTo: args.toDate }),
    ...(args.limit && { limit: args.limit }),
    ...(args.cursor && { cursor: args.cursor }),
  };
  return documentService.listDocuments(filters);
}

export async function updateDocument(args: z.infer<typeof updateDocumentSchema>) {
  authorize(getMcpRole(), 'document:update');
  const { documentId, lineItems, ...rest } = args;
  const updates = {
    ...rest,
    ...(lineItems && { items: toLineItems(lineItems) }),
  };
  return documentService.updateDocument(documentId, updates);
}

export async function deleteDocument(args: z.infer<typeof deleteDocumentSchema>) {
  authorize(getMcpRole(), 'document:delete');
  await documentService.deleteDocument(args.documentId);
  return { success: true };
}

export async function generatePdf(args: z.infer<typeof generatePdfSchema>) {
  authorize(getMcpRole(), 'document:read');
  // ビルド時評価を避けるため動的インポート（storage-gcs はランタイムのみ）
  const { generatePdfAction } = await import('@/actions/pdf');
  const result = await generatePdfAction(args.documentId);
  if (!result.success) throw new Error(result.error?.message ?? 'PDF生成失敗');
  return { pdfUrl: result.data!.pdfUrl };
}

export async function updateStatus(args: z.infer<typeof updateStatusSchema>, _userId: string) {
  const { documentId, newStatus } = args;
  // ステータスごとに必要な権限を確認
  if (newStatus === 'approved' || newStatus === 'rejected') {
    authorize(getMcpRole(), 'document:approve');
  } else if (newStatus === 'sent') {
    authorize(getMcpRole(), 'document:send');
  } else if (newStatus === 'cancelled') {
    authorize(getMcpRole(), 'document:cancel');
  } else {
    authorize(getMcpRole(), 'document:update');
  }
  if (newStatus === 'sent') {
    return documentService.sendDocument(documentId);
  }
  await documentRepo.updateDocumentStatus(documentId, newStatus);
  const updated = await documentService.getDocument(documentId);
  return updated;
}

export async function approveDoc(args: z.infer<typeof approveDocumentSchema>, userId: string) {
  authorize(getMcpRole(), 'document:approve');
  if (args.action === 'approve') {
    return approvalService.approveDocument({
      documentId: args.documentId,
      approverId: userId,
      approverName: userId,
      comment: args.comment,
    });
  } else {
    return approvalService.rejectDocument({
      documentId: args.documentId,
      approverId: userId,
      approverName: userId,
      comment: args.comment ?? '',
    });
  }
}

export async function listClients(args: z.infer<typeof listClientsSchema>) {
  authorize(getMcpRole(), 'document:read');
  if (args.name) {
    return clientService.searchClients(args.name, args.limit, args.cursor);
  }
  return clientService.listClients(args.limit, args.cursor);
}

export async function createClientTool(args: z.infer<typeof createClientSchema>) {
  authorize(getMcpRole(), 'client:create');
  return clientService.createClient({
    clientName: args.clientName,
    businessType: 'other',
    ...(args.email && { email: args.email }),
    ...(args.phone && { phone: args.phone }),
    ...(args.address && { address: args.address }),
    ...(args.contactPerson && { contactPerson: args.contactPerson }),
  });
}

export async function updateClientTool(args: z.infer<typeof updateClientSchema>) {
  authorize(getMcpRole(), 'client:update');
  const { clientId, ...updates } = args;
  return clientService.updateClient(clientId, updates);
}

export async function getDashboard(args: z.infer<typeof getDashboardSchema>) {
  authorize(getMcpRole(), 'document:read');
  const { dashboardService } = await import('@/services/dashboard.service');
  return dashboardService.getDashboardData();
}
