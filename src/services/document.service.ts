import { randomUUID } from 'crypto';
import * as documentRepo from '@/repositories/document.repository';
import * as sequenceRepo from '@/repositories/sequence.repository';
import { calculateTax } from '@/lib/tax-calculator';
import {
  formatDocumentNumber,
  formatRevisionNumber,
  toDateKey,
} from '@/lib/document-number';
import { DOCUMENT_NUMBER_PREFIX } from '@/lib/constants';
import type {
  DocumentHeader,
  LineItem,
  LineItemInput,
  DocumentListFilters,
  DocumentStatus,
  DocumentType,
} from '@/types/document';

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

/**
 * ステータスの事前条件チェック
 * allowedStatuses に含まれない場合は Error をスロー
 */
function assertStatus(
  doc: DocumentHeader,
  allowedStatuses: DocumentStatus[]
): void {
  if (!allowedStatuses.includes(doc.status)) {
    throw new Error(
      `ステータス ${doc.status} ではこの操作は実行できません`
    );
  }
}

/**
 * documentType から採番キー ('EST' | 'INV') を返す
 */
function toSequenceType(documentType: DocumentType): 'EST' | 'INV' {
  return DOCUMENT_NUMBER_PREFIX[documentType] as 'EST' | 'INV';
}

/**
 * 明細行入力から LineItem 配列を構築する
 */
function buildLineItems(
  documentId: string,
  items: LineItemInput[]
): LineItem[] {
  return items.map((item, index) => {
    const sortOrder = index + 1;
    return {
      PK: `DOC#${documentId}`,
      SK: `ITEM#${String(sortOrder).padStart(3, '0')}`,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      amount: item.quantity * item.unitPrice,
      sortOrder,
    };
  });
}

// ---------------------------------------------------------------------------
// タスク 1C-01: createDocument
// ---------------------------------------------------------------------------

export async function createDocument(input: {
  documentType: DocumentType;
  clientId: string;
  clientName: string;
  subject: string;
  issueDate: string; // YYYY-MM-DD
  validUntil?: string;
  dueDate?: string;
  notes?: string;
  items: LineItemInput[];
  createdBy: string;
  sourceEstimateId?: string;
  originalDocumentId?: string;
  revisionNumber?: number;
  documentNumber?: string; // 改訂時など番号を上書きする場合
}): Promise<DocumentHeader> {
  const documentId = randomUUID();
  const dateKey = toDateKey(input.issueDate);
  const seqType = toSequenceType(input.documentType);

  const seq = await sequenceRepo.getNextSequence(seqType, dateKey);
  const documentNumber =
    input.documentNumber ?? formatDocumentNumber(input.documentType, dateKey, seq);

  const taxSummary = calculateTax(input.items);
  const now = new Date().toISOString();

  const header: DocumentHeader = {
    PK: `DOC#${documentId}`,
    SK: 'META',
    documentId,
    documentType: input.documentType,
    documentNumber,
    status: 'draft',
    clientId: input.clientId,
    clientName: input.clientName,
    subject: input.subject,
    issueDate: input.issueDate,
    ...(input.validUntil !== undefined && { validUntil: input.validUntil }),
    ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
    subtotal: taxSummary.subtotal,
    tax10Amount: taxSummary.tax10Amount,
    tax8Amount: taxSummary.tax8Amount,
    taxAmount: taxSummary.taxAmount,
    totalAmount: taxSummary.totalAmount,
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.sourceEstimateId !== undefined && {
      sourceEstimateId: input.sourceEstimateId,
    }),
    ...(input.originalDocumentId !== undefined && {
      originalDocumentId: input.originalDocumentId,
    }),
    ...(input.revisionNumber !== undefined && {
      revisionNumber: input.revisionNumber,
    }),
    isDeleted: false,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const lineItems = buildLineItems(documentId, input.items);

  await documentRepo.createDocument(header, lineItems);

  return header;
}

// ---------------------------------------------------------------------------
// タスク 1C-02: updateDocument
// ---------------------------------------------------------------------------

export async function updateDocument(
  documentId: string,
  updates: {
    clientId?: string;
    clientName?: string;
    subject?: string;
    issueDate?: string;
    validUntil?: string;
    dueDate?: string;
    notes?: string;
    items?: LineItemInput[];
  }
): Promise<DocumentHeader> {
  const existing = await documentRepo.getDocumentById(documentId);
  if (!existing) {
    throw new Error(`帳票 ${documentId} が見つかりません`);
  }
  assertStatus(existing, ['draft']);

  const metaUpdates: Partial<DocumentHeader> = {};

  if (updates.clientId !== undefined) metaUpdates.clientId = updates.clientId;
  if (updates.clientName !== undefined) metaUpdates.clientName = updates.clientName;
  if (updates.subject !== undefined) metaUpdates.subject = updates.subject;
  if (updates.issueDate !== undefined) metaUpdates.issueDate = updates.issueDate;
  if (updates.validUntil !== undefined) metaUpdates.validUntil = updates.validUntil;
  if (updates.dueDate !== undefined) metaUpdates.dueDate = updates.dueDate;
  if (updates.notes !== undefined) metaUpdates.notes = updates.notes;

  if (updates.items !== undefined) {
    const taxSummary = calculateTax(updates.items);
    metaUpdates.subtotal = taxSummary.subtotal;
    metaUpdates.tax10Amount = taxSummary.tax10Amount;
    metaUpdates.tax8Amount = taxSummary.tax8Amount;
    metaUpdates.taxAmount = taxSummary.taxAmount;
    metaUpdates.totalAmount = taxSummary.totalAmount;
  }

  await documentRepo.updateDocumentMeta(documentId, metaUpdates);

  const updated = await documentRepo.getDocumentById(documentId);
  if (!updated) {
    throw new Error(`更新後の帳票 ${documentId} の取得に失敗しました`);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// タスク 1C-03: deleteDocument
// ---------------------------------------------------------------------------

export async function deleteDocument(documentId: string): Promise<void> {
  const existing = await documentRepo.getDocumentById(documentId);
  if (!existing) {
    throw new Error(`帳票 ${documentId} が見つかりません`);
  }
  assertStatus(existing, ['draft']);

  await documentRepo.softDeleteDocument(documentId);
}

// ---------------------------------------------------------------------------
// タスク 1C-04: cancelDocument
// ---------------------------------------------------------------------------

export async function cancelDocument(
  documentId: string,
  cancelReason: string
): Promise<DocumentHeader> {
  const existing = await documentRepo.getDocumentById(documentId);
  if (!existing) {
    throw new Error(`帳票 ${documentId} が見つかりません`);
  }
  assertStatus(existing, ['confirmed', 'sent']);

  await documentRepo.updateDocumentStatus(documentId, 'cancelled', {
    cancelledReason: cancelReason,
  });

  const updated = await documentRepo.getDocumentById(documentId);
  if (!updated) {
    throw new Error(`取消後の帳票 ${documentId} の取得に失敗しました`);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// タスク 1C-05: convertToInvoice
// ---------------------------------------------------------------------------

export async function convertToInvoice(
  estimateId: string,
  overrides: { dueDate: string; createdBy: string }
): Promise<DocumentHeader> {
  const estimate = await documentRepo.getDocumentById(estimateId);
  if (!estimate) {
    throw new Error(`見積書 ${estimateId} が見つかりません`);
  }
  if (estimate.documentType !== 'estimate') {
    throw new Error(`帳票 ${estimateId} は見積書ではありません`);
  }

  const lineItems = await documentRepo.getDocumentLineItems(estimateId);
  const lineItemInputs: LineItemInput[] = lineItems.map((li) => ({
    itemName: li.itemName,
    quantity: li.quantity,
    unit: li.unit,
    unitPrice: li.unitPrice,
    taxRate: li.taxRate,
  }));

  const invoice = await createDocument({
    documentType: 'invoice',
    clientId: estimate.clientId,
    clientName: estimate.clientName,
    subject: estimate.subject,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: overrides.dueDate,
    notes: estimate.notes,
    items: lineItemInputs,
    createdBy: overrides.createdBy,
    sourceEstimateId: estimateId,
  });

  await documentRepo.updateDocumentMeta(estimateId, {
    convertedToInvoiceId: invoice.documentId,
  });

  return invoice;
}

// ---------------------------------------------------------------------------
// タスク 1C-06: duplicateDocument
// ---------------------------------------------------------------------------

export async function duplicateDocument(
  documentId: string,
  createdBy: string
): Promise<DocumentHeader> {
  const original = await documentRepo.getDocumentById(documentId);
  if (!original) {
    throw new Error(`帳票 ${documentId} が見つかりません`);
  }

  const lineItems = await documentRepo.getDocumentLineItems(documentId);
  const lineItemInputs: LineItemInput[] = lineItems.map((li) => ({
    itemName: li.itemName,
    quantity: li.quantity,
    unit: li.unit,
    unitPrice: li.unitPrice,
    taxRate: li.taxRate,
  }));

  const today = new Date().toISOString().slice(0, 10);

  const duplicated = await createDocument({
    documentType: original.documentType,
    clientId: original.clientId,
    clientName: original.clientName,
    subject: original.subject,
    issueDate: today,
    ...(original.validUntil !== undefined && { validUntil: original.validUntil }),
    ...(original.dueDate !== undefined && { dueDate: original.dueDate }),
    notes: original.notes,
    items: lineItemInputs,
    createdBy,
  });

  return duplicated;
}

// ---------------------------------------------------------------------------
// タスク 1C-07: reviseEstimate
// ---------------------------------------------------------------------------

export async function reviseEstimate(
  estimateId: string,
  createdBy: string
): Promise<DocumentHeader> {
  const original = await documentRepo.getDocumentById(estimateId);
  if (!original) {
    throw new Error(`見積書 ${estimateId} が見つかりません`);
  }
  if (original.documentType !== 'estimate') {
    throw new Error(`帳票 ${estimateId} は見積書ではありません`);
  }

  const lineItems = await documentRepo.getDocumentLineItems(estimateId);
  const lineItemInputs: LineItemInput[] = lineItems.map((li) => ({
    itemName: li.itemName,
    quantity: li.quantity,
    unit: li.unit,
    unitPrice: li.unitPrice,
    taxRate: li.taxRate,
  }));

  const newRevisionNumber = (original.revisionNumber ?? 0) + 1;
  const newDocumentNumber = formatRevisionNumber(
    original.documentNumber,
    newRevisionNumber
  );

  const revised = await createDocument({
    documentType: 'estimate',
    clientId: original.clientId,
    clientName: original.clientName,
    subject: original.subject,
    issueDate: original.issueDate,
    ...(original.validUntil !== undefined && { validUntil: original.validUntil }),
    notes: original.notes,
    items: lineItemInputs,
    createdBy,
    originalDocumentId: estimateId,
    revisionNumber: newRevisionNumber,
    documentNumber: newDocumentNumber,
  });

  await documentRepo.updateDocumentMeta(estimateId, {
    revisedByDocumentId: revised.documentId,
  });

  return revised;
}

// ---------------------------------------------------------------------------
// タスク 1C-08: sendDocument
// ---------------------------------------------------------------------------

export async function sendDocument(documentId: string): Promise<DocumentHeader> {
  const existing = await documentRepo.getDocumentById(documentId);
  if (!existing) {
    throw new Error(`帳票 ${documentId} が見つかりません`);
  }
  assertStatus(existing, ['confirmed']);

  await documentRepo.updateDocumentStatus(documentId, 'sent');

  const updated = await documentRepo.getDocumentById(documentId);
  if (!updated) {
    throw new Error(`送付後の帳票 ${documentId} の取得に失敗しました`);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// タスク 1C-09: listDocuments / getDocument
// ---------------------------------------------------------------------------

export async function listDocuments(filters: DocumentListFilters): Promise<{
  items: DocumentHeader[];
  cursor?: string;
}> {
  return documentRepo.listDocuments(filters);
}

export async function getDocument(
  documentId: string
): Promise<DocumentHeader | null> {
  return documentRepo.getDocumentById(documentId);
}
