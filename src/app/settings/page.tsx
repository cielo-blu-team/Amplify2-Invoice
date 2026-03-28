export const dynamic = 'force-dynamic';

import { getCompanySettings } from '@/queries/settings';
import CompanySettingsForm from './CompanySettingsForm';

export default async function SettingsPage() {
  const settings = await getCompanySettings().catch(() => null);
  return <CompanySettingsForm initialData={settings} />;
}
