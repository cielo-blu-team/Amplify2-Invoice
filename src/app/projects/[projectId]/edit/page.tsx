export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getProject } from '@/queries/project';
import ProjectEditClient from './ProjectEditClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectEditPage({ params }: Props) {
  const { projectId } = await params;
  const project = await getProject(projectId).catch(() => null);
  if (!project) notFound();
  return <ProjectEditClient project={project} />;
}
