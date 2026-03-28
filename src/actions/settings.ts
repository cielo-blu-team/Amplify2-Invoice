'use server';

import * as settingsService from '@/services/settings.service';
import { companySettingsSchema } from '@/schemas/settings.schema';
import type { ApiResponse, CompanySettings } from '@/types';

export async function updateCompanySettings(
  input: unknown
): Promise<ApiResponse<CompanySettings>> {
  try {
    const parsed = companySettingsSchema.safeParse(input);
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
    const settings = await settingsService.updateCompanySettings(parsed.data);
    return { success: true, data: settings };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : '予期しないエラーが発生しました',
      },
    };
  }
}
