export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getProject } from '@/queries/project';
import ProjectDetailClient from './ProjectDetailClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  const project = await getProject(projectId).catch(() => null);
  if (!project) notFound();
  return <ProjectDetailClient project={project} />;
}
