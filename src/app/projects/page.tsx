export const dynamic = 'force-dynamic';

import { getProjects } from '@/queries/project';
import ProjectListClient from './ProjectListClient';

export default async function ProjectsPage() {
  const result = await getProjects({ limit: 100 }).catch(() => ({ items: [], cursor: undefined }));
  return <ProjectListClient initialData={result} />;
}
