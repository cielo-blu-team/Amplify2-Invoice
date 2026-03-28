// src/queries/dashboard.ts
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardData } from '@/services/dashboard.service';

export async function getDashboardData(): Promise<DashboardData> {
  return dashboardService.getDashboardData();
}
