export const dynamic = 'force-dynamic';
import { getNotificationSettings } from '@/queries/notification-settings';
import NotificationSettingsClient from './NotificationSettingsClient';

export default async function NotificationSettingsPage() {
  const settings = await getNotificationSettings('current-user').catch(() => null);
  return <NotificationSettingsClient initialSettings={settings} />;
}
