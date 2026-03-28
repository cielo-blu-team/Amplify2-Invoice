import * as userService from '@/services/user.service';
import type { NotificationSettings } from '@/types';

export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  const user = await userService.getUser(userId);
  return user?.notificationSettings ?? null;
}
