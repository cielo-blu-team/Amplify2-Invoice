// TODO: 実際の集計実装時に document.repository の関数を直接インポートして使用する
// import * as documentRepository from '@/repositories/document.repository';

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
    // TODO: 実際の集計実装（GSIクエリで月次集計）
    // 現在はモックデータ返却（DBスキャンは高コストのため、将来的にElasticSearchまたはDynamoDB Aggregationで実装）
    const today = new Date();

    return {
      monthlySales: this.generateMonthlySales(6),
      unpaidSummary: { totalUnpaid: 3850000, count: 8, overdue30: 1200000 },
      winRate: { totalEstimates: 45, convertedToInvoice: 32, winRate: 71 },
      overdueAlerts: [
        {
          documentId: 'DOC-001',
          documentNumber: 'INV-20260201-001',
          clientName: '株式会社サンプル',
          dueDate: '2026-02-28',
          totalAmount: 550000,
          daysOverdue: Math.floor(
            (today.getTime() - new Date('2026-02-28').getTime()) / 86400000
          ),
        },
      ],
      recentDocuments: [
        {
          documentId: 'DOC-002',
          documentNumber: 'EST-20260325-001',
          documentType: 'estimate',
          clientName: '株式会社テスト',
          status: 'draft',
          totalAmount: 220000,
          createdAt: new Date().toISOString(),
        },
        {
          documentId: 'DOC-003',
          documentNumber: 'INV-20260320-005',
          documentType: 'invoice',
          clientName: '有限会社サンプル',
          status: 'sent',
          totalAmount: 110000,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    };
  }

  private generateMonthlySales(months: number): MonthlySales[] {
    const result: MonthlySales[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const invoiceAmount = Math.floor(Math.random() * 2000000 + 500000);
      result.push({ month, invoiceAmount, paidAmount: Math.floor(invoiceAmount * 0.8) });
    }
    return result;
  }
}

export const dashboardService = new DashboardService();
