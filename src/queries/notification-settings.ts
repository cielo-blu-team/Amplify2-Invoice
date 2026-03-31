import * as userService from '@/services/user.service';
import { getSlackChannelConfig, type SlackChannelConfig } from '@/repositories/settings.repository';
import type { NotificationSettings } from '@/types';

export type { SlackChannelConfig };

export interface NotificationConfig {
  settings: NotificationSettings;
  slackChannels: SlackChannelConfig;
}

const DEFAULT_CHANNELS: SlackChannelConfig = {
  approvalChannel: '#approvals',
  alertChannel: '#alerts',
  paymentChannel: '#payments',
  generalChannel: '#general',
};

export async function getNotificationConfig(userId: string): Promise<NotificationConfig | null> {
  const user = await userService.getUser(userId);
  if (!user) return null;
  const slackChannels = await getSlackChannelConfig().catch(() => null);
  return {
    settings: user.notificationSettings,
    slackChannels: slackChannels ?? DEFAULT_CHANNELS,
  };
}
