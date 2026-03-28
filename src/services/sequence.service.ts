import * as sequenceRepo from '@/repositories/sequence.repository';
import { formatDocumentNumber, toDateKey } from '@/lib/document-number';
import type { DocumentType } from '@/types';

// 帳票番号採番
export async function getNextDocumentNumber(type: DocumentType, date: Date): Promise<string> {
  const prefix = type === 'estimate' ? 'EST' : 'INV';
  const dateKey = toDateKey(date.toISOString());
  const seq = await sequenceRepo.getNextSequence(prefix, dateKey);
  return formatDocumentNumber(type, dateKey, seq);
}
