export const dynamic = 'force-dynamic';
import { getCurrentUserId } from '@/lib/auth-server';
import { getNotificationConfig } from '@/queries/notification-settings';
import NotificationSettingsClient from './NotificationSettingsClient';

export default async function NotificationSettingsPage() {
  const userId = await getCurrentUserId();
  const config = await getNotificationConfig(userId).catch(() => null);
  return (
    <NotificationSettingsClient
      initialSettings={config?.settings ?? null}
      initialSlackChannel={config?.slackChannel ?? ''}
    />
  );
}
