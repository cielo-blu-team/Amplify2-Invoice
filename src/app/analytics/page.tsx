export const dynamic = 'force-dynamic';

import { analyticsService } from '@/services/analytics.service';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const [overall, clients, projects] = await Promise.all([
    analyticsService.getOverallAnalytics().catch(() => null),
    analyticsService.getClientAnalytics().catch(() => []),
    analyticsService.getProjectAnalytics().catch(() => null),
  ]);

  return <AnalyticsClient overall={overall} clients={clients} projects={projects} />;
}
