export const dynamic = 'force-dynamic';
import TemplateListClient from './TemplateListClient';
import { templateService } from '@/services/template.service';

export default async function TemplatesPage() {
  const templates = await templateService.listTemplates().catch(() => []);
  return <TemplateListClient initialTemplates={templates} />;
}
