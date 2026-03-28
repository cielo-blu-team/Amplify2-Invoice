import { DOCUMENT_NUMBER_PREFIX } from './constants';
import type { DocumentType } from '@/types/document';

/**
 * 帳票番号のフォーマット
 * EST-YYYYMMDD-NNN / INV-YYYYMMDD-NNN
 */
export function formatDocumentNumber(
  type: DocumentType,
  date: string, // YYYYMMDD
  sequence: number,
): string {
  const prefix = DOCUMENT_NUMBER_PREFIX[type];
  const num = String(sequence).padStart(3, '0');
  return `${prefix}-${date}-${num}`;
}

/**
 * 改訂版帳票番号のフォーマット
 * EST-YYYYMMDD-NNN-R{revision}
 */
export function formatRevisionNumber(
  baseNumber: string,
  revisionNumber: number,
): string {
  return `${baseNumber}-R${revisionNumber}`;
}

/**
 * 日付文字列(ISO 8601)をYYYYMMDD形式に変換
 */
export function toDateKey(isoDate: string): string {
  return isoDate.replace(/-/g, '').slice(0, 8);
}
