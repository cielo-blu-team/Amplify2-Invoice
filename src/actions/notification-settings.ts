'use server';

import * as userService from '@/services/user.service';
import { saveNotificationConfigSchema } from '@/schemas/user.schema';
import { saveSlackChannelConfig } from '@/repositories/settings.repository';
import { getCurrentUserId } from '@/lib/auth-server';
import type { ApiResponse, NotificationSettings } from '@/types';
import type { SlackChannelConfig } from '@/queries/notification-settings';

export interface NotificationConfigInput {
  settings: NotificationSettings;
  slackChannels?: SlackChannelConfig;
}

export async function updateNotificationSettings(
  _unused: string,
  input: NotificationConfigInput,
): Promise<ApiResponse<NotificationSettings>> {
  try {
    const userId = await getCurrentUserId();

    const parsed = saveNotificationConfigSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力値が不正です',
          details: parsed.error.flatten().fieldErrors as Record<string, unknown>,
        },
      };
    }

    const [user] = await Promise.all([
      userService.updateNotificationConfig(userId, { settings: parsed.data.settings }),
      parsed.data.slackChannels
        ? saveSlackChannelConfig(parsed.data.slackChannels)
        : Promise.resolve(),
    ]);
    return { success: true, data: user.notificationSettings };
  } catch (err) {
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    if (message.includes('not found')) {
      return { success: false, error: { code: 'NOT_FOUND', message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message } };
  }
}
