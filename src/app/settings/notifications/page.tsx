export const dynamic = 'force-dynamic';
import { getCurrentUserId } from '@/lib/auth-server';
import { getNotificationConfig } from '@/queries/notification-settings';
import NotificationSettingsClient from './NotificationSettingsClient';

const DEFAULT_CHANNELS = {
  approvalChannel: '#approvals',
  alertChannel: '#alerts',
  paymentChannel: '#payments',
  generalChannel: '#general',
};

export default async function NotificationSettingsPage() {
  const userId = await getCurrentUserId();
  const config = await getNotificationConfig(userId).catch(() => null);
  return (
    <NotificationSettingsClient
      initialSettings={config?.settings ?? null}
      initialSlackChannels={config?.slackChannels ?? DEFAULT_CHANNELS}
    />
  );
}
