export const dynamic = 'force-dynamic';

import IntegrationsClient from './IntegrationsClient';
import { getSystemSettings } from '@/repositories/system-settings.repository';

export default async function IntegrationsPage() {
  // REST API 版 or MCP 版のどちらかで連携済みかを判定
  const hasRestApi = !!(process.env.MF_OAUTH_REFRESH_TOKEN &&
    process.env.MF_OAUTH_REFRESH_TOKEN !== 'placeholder');

  const systemSettings = await getSystemSettings().catch(() => ({
    mfSyncEnabled: false,
    aiConfidenceThreshold: 90,
  }));

  return <IntegrationsClient isConnected={hasRestApi} systemSettings={systemSettings} />;
}
