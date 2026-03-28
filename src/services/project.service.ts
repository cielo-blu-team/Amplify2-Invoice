import { v4 as uuidv4 } from 'uuid';
import * as projectRepo from '@/repositories/project.repository';
import type { Project, ProjectCreateInput, ProjectUpdateInput, ProjectListFilters } from '@/types';

export async function createProject(input: ProjectCreateInput): Promise<Project> {
  const projectId = uuidv4();
  const now = new Date().toISOString();

  const data: Project = {
    PK: `PROJECT#${projectId}`,
    SK: 'META',
    projectId,
    projectName: input.projectName,
    clientId: input.clientId,
    clientName: input.clientName,
    status: input.status,
    priority: input.priority,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    budget: input.budget,
    assignedTo: input.assignedTo,
    notes: input.notes,
    isDeleted: false,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await projectRepo.createProject(data);
  return data;
}

export async function updateProject(projectId: string, updates: ProjectUpdateInput): Promise<Project> {
  const existing = await projectRepo.getProjectById(projectId);
  if (!existing) throw new Error(`Project not found: ${projectId}`);
  await projectRepo.updateProject(projectId, updates as Partial<Project>);
  const updated = await projectRepo.getProjectById(projectId);
  if (!updated) throw new Error(`Project not found after update: ${projectId}`);
  return updated;
}

export async function deleteProject(projectId: string): Promise<void> {
  const existing = await projectRepo.getProjectById(projectId);
  if (!existing) throw new Error(`Project not found: ${projectId}`);
  await projectRepo.softDeleteProject(projectId);
}

export async function getProject(projectId: string): Promise<Project | null> {
  return projectRepo.getProjectById(projectId);
}

export async function listProjects(filters?: ProjectListFilters): Promise<{ items: Project[]; cursor?: string }> {
  return projectRepo.listProjects(filters?.limit, filters?.cursor, filters?.status);
}
