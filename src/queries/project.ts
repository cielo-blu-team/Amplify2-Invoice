import * as projectService from '@/services/project.service';
import type { ProjectListFilters, Project } from '@/types';

export async function getProjects(
  filters?: ProjectListFilters
): Promise<{ items: Project[]; cursor?: string }> {
  return projectService.listProjects(filters);
}

export async function getProject(projectId: string): Promise<Project | null> {
  return projectService.getProject(projectId);
}
