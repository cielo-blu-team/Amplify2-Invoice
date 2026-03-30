import { getFirestoreClient } from '@/repositories/_firestore-client';
import { COLLECTIONS } from '@/lib/constants';
import type { DocumentHeader } from '@/types';

export interface DashboardData {
  monthlySales: MonthlySales[];
  unpaidSummary: UnpaidSummary;
  winRate: WinRateData;
  overdueAlerts: OverdueAlert[];
  recentDocuments: RecentDocument[];
}

export interface MonthlySales {
  month: string; // YYYY-MM
  invoiceAmount: number;
  paidAmount: number;
}

export interface UnpaidSummary {
  totalUnpaid: number;
  count: number;
  overdue30: number; // 30日以上未入金
}

export interface WinRateData {
  totalEstimates: number;
  convertedToInvoice: number;
  winRate: number; // 0-100
}

export interface OverdueAlert {
  documentId: string;
  documentNumber: string;
  clientName: string;
  dueDate: string;
  totalAmount: number;
  daysOverdue: number;
}

export interface RecentDocument {
  documentId: string;
  documentNumber: string;
  documentType: 'estimate' | 'invoice';
  clientName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    const db = getFirestoreClient();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // 6ヶ月前の日付
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

    // 30日前の日付（延滞30日超判定）
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const col = db.collection(COLLECTIONS.DOCUMENTS);

    // 並列でクエリ実行
    const [recentSnap, unpaidSnap, overdueSnap, estimatesSnap] = await Promise.all([
      // 最近の帳票（全種類、直近20件）
      col.where('isDeleted', '==', false).orderBy('createdAt', 'desc').limit(20).get(),
      // 未入金の請求書（sent）
      col
        .where('isDeleted', '==', false)
        .where('documentType', '==', 'invoice')
        .where('status', '==', 'sent')
        .get(),
      // 延滞請求書
      col
        .where('isDeleted', '==', false)
        .where('documentType', '==', 'invoice')
        .where('status', '==', 'overdue')
        .get(),
      // 見積書（受注率計算用）
      col
        .where('isDeleted', '==', false)
        .where('documentType', '==', 'estimate')
        .get(),
    ]);

    const allRecent = recentSnap.docs.map(
      (d) => ({ ...d.data(), documentId: d.id }) as DocumentHeader,
    );
    const unpaidDocs = unpaidSnap.docs.map(
      (d) => ({ ...d.data(), documentId: d.id }) as DocumentHeader,
    );
    const overdueDocs = overdueSnap.docs.map(
      (d) => ({ ...d.data(), documentId: d.id }) as DocumentHeader,
    );
    const estimateDocs = estimatesSnap.docs.map(
      (d) => ({ ...d.data(), documentId: d.id }) as DocumentHeader,
    );

    // --- 月次売上（過去6ヶ月の請求書集計） ---
    const invoiceDocs = allRecent.filter(
      (d) => d.documentType === 'invoice' && d.issueDate >= sixMonthsAgoStr,
    );
    const monthlySales = this.aggregateMonthlySales(invoiceDocs, 6);

    // --- 未入金サマリー ---
    const totalUnpaid = unpaidDocs.reduce((s, d) => s + d.totalAmount, 0);
    const overdue30 = unpaidDocs
      .filter((d) => d.dueDate && d.dueDate <= thirtyDaysAgoStr)
      .reduce((s, d) => s + d.totalAmount, 0);
    const unpaidSummary: UnpaidSummary = {
      totalUnpaid,
      count: unpaidDocs.length,
      overdue30,
    };

    // --- 受注率 ---
    const convertedCount = estimateDocs.filter(
      (d) => d.status === 'converted' || d.status === 'approved',
    ).length;
    const winRate: WinRateData = {
      totalEstimates: estimateDocs.length,
      convertedToInvoice: convertedCount,
      winRate:
        estimateDocs.length > 0
          ? Math.round((convertedCount / estimateDocs.length) * 100)
          : 0,
    };

    // --- 延滞アラート ---
    const overdueAlerts: OverdueAlert[] = overdueDocs
      .filter((d) => d.dueDate)
      .map((d) => ({
        documentId: d.documentId,
        documentNumber: d.documentNumber,
        clientName: d.clientName,
        dueDate: d.dueDate!,
        totalAmount: d.totalAmount,
        daysOverdue: Math.floor(
          (now.getTime() - new Date(d.dueDate!).getTime()) / 86400000,
        ),
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .slice(0, 10);

    // --- 最近の帳票 ---
    const recentDocuments: RecentDocument[] = allRecent.slice(0, 10).map((d) => ({
      documentId: d.documentId,
      documentNumber: d.documentNumber,
      documentType: d.documentType,
      clientName: d.clientName,
      status: d.status,
      totalAmount: d.totalAmount,
      createdAt: d.createdAt,
    }));

    return { monthlySales, unpaidSummary, winRate, overdueAlerts, recentDocuments };
  }

  private aggregateMonthlySales(invoices: DocumentHeader[], months: number): MonthlySales[] {
    const map = new Map<string, { invoiceAmount: number; paidAmount: number }>();

    // 過去N ヶ月分の月を初期化
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, { invoiceAmount: 0, paidAmount: 0 });
    }

    for (const doc of invoices) {
      const month = doc.issueDate.slice(0, 7);
      if (!map.has(month)) continue;
      const entry = map.get(month)!;
      entry.invoiceAmount += doc.totalAmount;
      if (doc.status === 'paid') {
        entry.paidAmount += doc.totalAmount;
      }
    }

    return Array.from(map.entries()).map(([month, v]) => ({ month, ...v }));
  }
}

export const dashboardService = new DashboardService();
