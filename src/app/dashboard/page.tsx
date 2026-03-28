export const dynamic = 'force-dynamic';

import { getDashboardData } from '@/queries/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const data = await getDashboardData().catch(() => ({ monthlySales: [], unpaidSummary: { totalUnpaid: 0, count: 0, overdue30: 0 }, winRate: { totalEstimates: 0, convertedToInvoice: 0, winRate: 0 }, overdueAlerts: [], recentDocuments: [] }));
  return <DashboardClient initialData={data} />;
}
