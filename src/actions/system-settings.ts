'use server';

import type { ApiResponse, SystemSettings } from '@/types';
import * as settingsRepo from '@/repositories/system-settings.repository';

export async function updateSystemSettingsAction(
  updates: Partial<SystemSettings>,
): Promise<ApiResponse<void>> {
  try {
    await settingsRepo.updateSystemSettings(updates);
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : '設定の保存に失敗しました',
      },
    };
  }
}
