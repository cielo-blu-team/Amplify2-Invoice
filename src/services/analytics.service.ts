// 分析サービス（現在はモックデータ。将来的にDynamoDB集計クエリに差し替え）

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

class AnalyticsService {
  private months(n: number): string[] {
    const result: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return result;
  }

  async getClientAnalytics(): Promise<ClientAnalytics[]> {
    const clients = [
      { clientId: 'c1', clientName: '株式会社テクノソリューション', totalInvoiced: 8500000, totalPaid: 8200000, invoiceCount: 24, estimateCount: 30 },
      { clientId: 'c2', clientName: '有限会社グローバルトレード', totalInvoiced: 6200000, totalPaid: 5100000, invoiceCount: 18, estimateCount: 22 },
      { clientId: 'c3', clientName: 'ＡＢＣ商事株式会社', totalInvoiced: 4800000, totalPaid: 4800000, invoiceCount: 12, estimateCount: 15 },
      { clientId: 'c4', clientName: '株式会社フューチャーワークス', totalInvoiced: 3600000, totalPaid: 2900000, invoiceCount: 10, estimateCount: 14 },
      { clientId: 'c5', clientName: '合同会社デジタルクリエイト', totalInvoiced: 2900000, totalPaid: 2900000, invoiceCount: 8, estimateCount: 9 },
      { clientId: 'c6', clientName: '株式会社イノベーションラボ', totalInvoiced: 2200000, totalPaid: 1800000, invoiceCount: 7, estimateCount: 12 },
      { clientId: 'c7', clientName: 'サンプル工業株式会社', totalInvoiced: 1800000, totalPaid: 1800000, invoiceCount: 5, estimateCount: 6 },
      { clientId: 'c8', clientName: '株式会社ネクストステップ', totalInvoiced: 1200000, totalPaid: 800000, invoiceCount: 4, estimateCount: 8 },
    ];

    const dates = ['2026-03-15', '2026-03-20', '2026-03-10', '2026-02-28', '2026-03-22', '2026-03-01', '2026-02-15', '2026-03-18'];

    return clients.map((c, i) => ({
      ...c,
      unpaid: c.totalInvoiced - c.totalPaid,
      paymentRate: Math.round((c.totalPaid / c.totalInvoiced) * 100),
      winRate: Math.round((c.invoiceCount / c.estimateCount) * 100),
      lastTransactionDate: dates[i],
    }));
  }

  async getProjectAnalytics(): Promise<ProjectAnalytics> {
    const months = this.months(6);
    return {
      statusDistribution: [
        { status: 'in_progress', label: '進行中', count: 12, color: '#6366f1' },
        { status: 'planning',    label: '計画中', count: 8,  color: '#94a3b8' },
        { status: 'completed',   label: '完了',   count: 20, color: '#22c55e' },
        { status: 'suspended',   label: '中断',   count: 3,  color: '#f59e0b' },
        { status: 'lost',        label: '失注',   count: 5,  color: '#ef4444' },
      ],
      priorityDistribution: [
        { priority: 'high',   label: '高', count: 15, color: '#ef4444' },
        { priority: 'medium', label: '中', count: 22, color: '#f59e0b' },
        { priority: 'low',    label: '低', count: 11, color: '#94a3b8' },
      ],
      assigneeStats: [
        { assignedTo: '山田 太郎', count: 14, totalBudget: 12500000 },
        { assignedTo: '佐藤 花子', count: 11, totalBudget: 9800000 },
        { assignedTo: '鈴木 一郎', count: 8,  totalBudget: 7200000 },
        { assignedTo: '田中 美香', count: 7,  totalBudget: 5600000 },
        { assignedTo: '未割当',    count: 8,  totalBudget: 3200000 },
      ],
      budgetSummary: { totalBudget: 38300000, avgBudget: 1596000, projectCount: 48 },
      monthlyCreated: months.map((month, i) => ({ month, count: [4, 7, 3, 9, 5, 6][i] ?? 4 })),
    };
  }

  async getOverallAnalytics(): Promise<OverallAnalytics> {
    const months = this.months(6);
    return {
      totalRevenue: 31200000,
      totalPaid: 27600000,
      totalUnpaid: 3600000,
      totalClients: 32,
      totalProjects: 48,
      avgPaymentRate: 88,
      monthlyTrend: months.map((month, i) => {
        const invoiced = [4200000, 5800000, 3900000, 6100000, 5200000, 6000000][i];
        return { month, invoiced, paid: Math.floor(invoiced * [0.9, 0.82, 1.0, 0.78, 0.88, 0.92][i]) };
      }),
    };
  }
}

export const analyticsService = new AnalyticsService();
