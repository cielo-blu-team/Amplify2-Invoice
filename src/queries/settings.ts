import * as settingsService from '@/services/settings.service';
import type { CompanySettings } from '@/types';

export async function getCompanySettings(): Promise<CompanySettings | null> {
  return settingsService.getCompanySettings();
}
