import * as settingsRepo from '@/repositories/settings.repository';
import type { CompanySettings } from '@/types';

// 自社情報取得
export async function getCompanySettings(): Promise<CompanySettings | null> {
  return settingsRepo.getCompanySettings();
}

// 自社情報更新（既存設定とマージ）
export async function updateCompanySettings(
  updates: Partial<CompanySettings>
): Promise<CompanySettings> {
  const existing = await settingsRepo.getCompanySettings();

  const merged: CompanySettings & { settingsId?: string; updatedAt?: string } = {
    ...(existing ?? ({} as CompanySettings)),
    ...updates,
    settingsId: 'company',
    updatedAt: new Date().toISOString(),
  };

  await settingsRepo.saveCompanySettings(merged);

  // settingsId / updatedAt を除いた CompanySettings を返す
  const { settingsId: _s, updatedAt: _u, ...result } = merged;
  return result as CompanySettings;
}
