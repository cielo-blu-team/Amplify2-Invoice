'use server';

import * as projectService from '@/services/project.service';
import { projectCreateSchema, projectUpdateSchema } from '@/schemas/project.schema';
import type { ApiResponse, Project } from '@/types';

export async function createProject(input: unknown): Promise<ApiResponse<Project>> {
  try {
    const parsed = projectCreateSchema.safeParse(input);
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
    const project = await projectService.createProject(parsed.data);
    return { success: true, data: project };
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

export async function updateProject(projectId: string, input: unknown): Promise<ApiResponse<Project>> {
  try {
    const parsed = projectUpdateSchema.safeParse(input);
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
    const { projectId: _id, ...updates } = parsed.data;
    const project = await projectService.updateProject(projectId, updates);
    return { success: true, data: project };
  } catch (err) {
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    return {
      success: false,
      error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message },
    };
  }
}

export async function deleteProject(projectId: string): Promise<ApiResponse<void>> {
  try {
    await projectService.deleteProject(projectId);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    return {
      success: false,
      error: { code: message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR', message },
    };
  }
}
