import * as userService from '@/services/user.service';
import type { NotificationSettings } from '@/types';

export interface NotificationConfig {
  settings: NotificationSettings;
  slackChannel: string;
}

export async function getNotificationConfig(userId: string): Promise<NotificationConfig | null> {
  const user = await userService.getUser(userId);
  if (!user) return null;
  return {
    settings: user.notificationSettings,
    slackChannel: user.slackChannel ?? '',
  };
}
