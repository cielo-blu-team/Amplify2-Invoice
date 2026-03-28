'use server';

import * as userService from '@/services/user.service';
import { notificationSettingsSchema } from '@/schemas/user.schema';
import type { ApiResponse, NotificationSettings } from '@/types';

export async function updateNotificationSettings(
  userId: string,
  settings: unknown
): Promise<ApiResponse<NotificationSettings>> {
  try {
    const parsed = notificationSettingsSchema.safeParse(settings);
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
    const user = await userService.updateNotificationSettings(userId, parsed.data);
    return { success: true, data: user.notificationSettings };
  } catch (err) {
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    if (message.includes('not found')) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message },
      };
    }
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    };
  }
}
