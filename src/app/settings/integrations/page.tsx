export const dynamic = 'force-dynamic';

import IntegrationsClient from './IntegrationsClient';

export default function IntegrationsPage() {
  // REST API 版 or MCP 版のどちらかで連携済みかを判定
  const hasRestApi = !!(process.env.MF_OAUTH_REFRESH_TOKEN &&
    process.env.MF_OAUTH_REFRESH_TOKEN !== 'placeholder');
  // MCP 版はトークンが Secret Manager に保存されるため環境変数では判定できない
  // クエリパラメータ mf_mcp_connected=1 でコールバック直後を判定
  return <IntegrationsClient isConnected={hasRestApi} />;
}
