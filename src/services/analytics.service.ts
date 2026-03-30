import { getFirestoreClient } from '@/repositories/_firestore-client';
import { COLLECTIONS } from '@/lib/constants';
import type { DocumentHeader } from '@/types';
import type { Project } from '@/types';

export interface ClientAnalytics {
  clientId: string;
  clientName: string;
  totalInvoiced: number;
  totalPaid: number;
  unpaid: number;
  paymentRate: number; // 0-100
  invoiceCount: number;
  estimateCount: number;
  winRate: number; // 0-100
  lastTransactionDate: string;
}

export interface ProjectAnalytics {
  statusDistribution: { status: string; label: string; count: number; color: string }[];
  priorityDistribution: { priority: string; label: string; count: number; color: string }[];
  assigneeStats: { assignedTo: string; count: number; totalBudget: number }[];
  budgetSummary: { totalBudget: number; avgBudget: number; projectCount: number };
  monthlyCreated: { month: string; count: number }[];
}

export interface OverallAnalytics {
  totalRevenue: number;
  totalPaid: number;
  totalUnpaid: number;
  totalClients: number;
  totalProjects: number;
  avgPaymentRate: number;
  monthlyTrend: { month: string; invoiced: number; paid: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: '進行中', planning: '計画中', completed: '完了', suspended: '中断', lost: '失注',
};
const STATUS_COLORS: Record<string, string> = {
  in_progress: '#6366f1', planning: '#94a3b8', completed: '#22c55e', suspended: '#f59e0b', lost: '#ef4444',
};
const PRIORITY_LABELS: Record<string, string> = { high: '高', medium: '中', low: '低' };
const PRIORITY_COLORS: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' };

class AnalyticsService {
  private monthKeys(n: number): string[] {
    const result: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return result;
  }

  async getClientAnalytics(): Promise<ClientAnalytics[]> {
    const db = getFirestoreClient();

    // 全請求書・見積書を取得
    const snap = await db
      .collection(COLLECTIONS.DOCUMENTS)
      .where('isDeleted', '==', false)
      .get();

    const docs = snap.docs.map((d) => ({ ...d.data(), documentId: d.id }) as DocumentHeader);

    // clientId ごとに集計
    const map = new Map<string, {
      clientName: string;
      totalInvoiced: number;
      totalPaid: number;
      invoiceCount: number;
      estimateCount: number;
      lastDate: string;
    }>();

    for (const doc of docs) {
      if (!map.has(doc.clientId)) {
        map.set(doc.clientId, {
          clientName: doc.clientName,
          totalInvoiced: 0,
          totalPaid: 0,
          invoiceCount: 0,
          estimateCount: 0,
          lastDate: doc.issueDate,
        });
      }
      const entry = map.get(doc.clientId)!;
      entry.clientName = doc.clientName;
      if (doc.issueDate > entry.lastDate) entry.lastDate = doc.issueDate;

      if (doc.documentType === 'invoice') {
        entry.totalInvoiced += doc.totalAmount;
        if (doc.status === 'paid') entry.totalPaid += doc.totalAmount;
        entry.invoiceCount++;
      } else if (doc.documentType === 'estimate') {
        entry.estimateCount++;
      }
    }

    return Array.from(map.entries())
      .map(([clientId, e]) => ({
        clientId,
        clientName: e.clientName,
        totalInvoiced: e.totalInvoiced,
        totalPaid: e.totalPaid,
        unpaid: e.totalInvoiced - e.totalPaid,
        paymentRate: e.totalInvoiced > 0 ? Math.round((e.totalPaid / e.totalInvoiced) * 100) : 0,
        invoiceCount: e.invoiceCount,
        estimateCount: e.estimateCount,
        winRate: e.estimateCount > 0 ? Math.round((e.invoiceCount / e.estimateCount) * 100) : 0,
        lastTransactionDate: e.lastDate,
      }))
      .sort((a, b) => b.totalInvoiced - a.totalInvoiced);
  }

  async getProjectAnalytics(): Promise<ProjectAnalytics> {
    const db = getFirestoreClient();
    const months = this.monthKeys(6);

    const snap = await db
      .collection(COLLECTIONS.PROJECTS)
      .where('isDeleted', '==', false)
      .get();

    const projects = snap.docs.map((d) => ({ ...d.data(), projectId: d.id }) as Project);

    // ステータス分布
    const statusCount = new Map<string, number>();
    const priorityCount = new Map<string, number>();
    const assigneeMap = new Map<string, { count: number; totalBudget: number }>();
    const monthlyCount = new Map<string, number>(months.map((m) => [m, 0]));

    for (const p of projects) {
      statusCount.set(p.status, (statusCount.get(p.status) ?? 0) + 1);
      priorityCount.set(p.priority, (priorityCount.get(p.priority) ?? 0) + 1);

      const assignee = p.assignedTo ?? '未割当';
      const existing = assigneeMap.get(assignee) ?? { count: 0, totalBudget: 0 };
      assigneeMap.set(assignee, {
        count: existing.count + 1,
        totalBudget: existing.totalBudget + (p.budget ?? 0),
      });

      const month = p.createdAt?.slice(0, 7);
      if (month && monthlyCount.has(month)) {
        monthlyCount.set(month, (monthlyCount.get(month) ?? 0) + 1);
      }
    }

    const totalBudget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);

    return {
      statusDistribution: Array.from(statusCount.entries()).map(([status, count]) => ({
        status, label: STATUS_LABELS[status] ?? status, count, color: STATUS_COLORS[status] ?? '#94a3b8',
      })),
      priorityDistribution: Array.from(priorityCount.entries()).map(([priority, count]) => ({
        priority, label: PRIORITY_LABELS[priority] ?? priority, count, color: PRIORITY_COLORS[priority] ?? '#94a3b8',
      })),
      assigneeStats: Array.from(assigneeMap.entries())
        .map(([assignedTo, v]) => ({ assignedTo, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      budgetSummary: {
        totalBudget,
        avgBudget: projects.length > 0 ? Math.round(totalBudget / projects.length) : 0,
        projectCount: projects.length,
      },
      monthlyCreated: months.map((month) => ({ month, count: monthlyCount.get(month) ?? 0 })),
    };
  }

  async getOverallAnalytics(): Promise<OverallAnalytics> {
    const db = getFirestoreClient();
    const months = this.monthKeys(6);
    const sixMonthsAgo = months[0];

    const [invoiceSnap, clientSnap, projectSnap] = await Promise.all([
      db.collection(COLLECTIONS.DOCUMENTS)
        .where('isDeleted', '==', false)
        .where('documentType', '==', 'invoice')
        .get(),
      db.collection(COLLECTIONS.CLIENTS).where('isDeleted', '==', false).get(),
      db.collection(COLLECTIONS.PROJECTS).where('isDeleted', '==', false).get(),
    ]);

    const invoices = invoiceSnap.docs.map(
      (d) => ({ ...d.data(), documentId: d.id }) as DocumentHeader,
    );

    let totalRevenue = 0;
    let totalPaid = 0;
    const monthlyMap = new Map<string, { invoiced: number; paid: number }>(
      months.map((m) => [m, { invoiced: 0, paid: 0 }]),
    );

    for (const inv of invoices) {
      totalRevenue += inv.totalAmount;
      if (inv.status === 'paid') totalPaid += inv.totalAmount;

      const month = inv.issueDate?.slice(0, 7);
      if (month && monthlyMap.has(month)) {
        const entry = monthlyMap.get(month)!;
        entry.invoiced += inv.totalAmount;
        if (inv.status === 'paid') entry.paid += inv.totalAmount;
      }
    }

    const paidInvoices = invoices.filter((i) => i.totalAmount > 0);
    const avgPaymentRate =
      paidInvoices.length > 0
        ? Math.round(
            (paidInvoices.filter((i) => i.status === 'paid').length / paidInvoices.length) * 100,
          )
        : 0;

    return {
      totalRevenue,
      totalPaid,
      totalUnpaid: totalRevenue - totalPaid,
      totalClients: clientSnap.size,
      totalProjects: projectSnap.size,
      avgPaymentRate,
      monthlyTrend: months.map((month) => {
        const e = monthlyMap.get(month) ?? { invoiced: 0, paid: 0 };
        return { month, invoiced: e.invoiced, paid: e.paid };
      }),
    };
  }
}

export const analyticsService = new AnalyticsService();
