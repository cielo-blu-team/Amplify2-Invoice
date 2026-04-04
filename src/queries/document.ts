// Server-side data fetching（Server Component から呼ぶ）
// 'use server' ディレクティブは不要（queries/ は Server Component から直接呼ぶ）

import * as documentService from '@/services/document.service';
import * as documentRepo from '@/repositories/document.repository';
import type { DocumentHeader, DocumentListFilters, LineItem } from '@/types';

// ---------------------------------------------------------------------------
// タスク 1E-07: 帳票取得クエリ
// ---------------------------------------------------------------------------

/**
 * 帳票一覧を取得する
 */
export async function getDocuments(filters: DocumentListFilters): Promise<{
  items: DocumentHeader[];
  cursor?: string;
}> {
  return documentService.listDocuments(filters);
}

/**
 * 帳票を1件取得する。見つからない場合は null を返す。
 */
export async function getDocument(
  documentId: string,
): Promise<DocumentHeader | null> {
  return documentService.getDocument(documentId);
}

/**
 * 帳票ヘッダーと明細行をまとめて取得する。見つからない場合は null を返す。
 */
export async function getDocumentWithLineItems(
  documentId: string,
): Promise<{ header: DocumentHeader; lineItems: LineItem[] } | null> {
  const [header, lineItems] = await Promise.all([
    documentService.getDocument(documentId),
    documentRepo.getDocumentLineItems(documentId),
  ]);
  if (!header) return null;
  return { header, lineItems };
}
