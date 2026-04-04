export const dynamic = 'force-dynamic';

import IntegrationsClient from './IntegrationsClient';

export default function IntegrationsPage() {
  const isConnected = !!(process.env.MF_OAUTH_REFRESH_TOKEN &&
    process.env.MF_OAUTH_REFRESH_TOKEN !== 'placeholder');
  return <IntegrationsClient isConnected={isConnected} />;
}
