'use server';
import { listDocuments } from '@/services/document.service';
import { documentsToCsv } from '@/lib/csv-export';
import type { ApiResponse, DocumentStatus } from '@/types';

export async function exportDocumentsCsv(filters?: {
  documentType?: 'estimate' | 'invoice';
  status?: DocumentStatus[];
  fromDate?: string;
  toDate?: string;
}): Promise<ApiResponse<{ csv: string; filename: string }>> {
  try {
    const { items } = await listDocuments({ limit: 1000, ...filters });
    const csv = documentsToCsv(items);
    const filename = `documents_${new Date().toISOString().split('T')[0]}.csv`;
    return { success: true, data: { csv, filename } };
  } catch (e) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'CSV出力に失敗しました' } };
  }
}
