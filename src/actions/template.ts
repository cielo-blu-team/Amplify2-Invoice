'use server';
import { templateService } from '@/services/template.service';
import type { CreateTemplateInput } from '@/types/template';
import type { ApiResponse } from '@/types';
import type { DocumentTemplate } from '@/types/template';

export async function createTemplate(input: CreateTemplateInput): Promise<ApiResponse<DocumentTemplate>> {
  try {
    const template = await templateService.createTemplate(input, 'current-user');
    return { success: true, data: template };
  } catch (e) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'テンプレート作成に失敗しました' } };
  }
}

export async function deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
  try {
    await templateService.deleteTemplate(templateId);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : '削除に失敗しました' } };
  }
}

export async function updateTemplate(templateId: string, updates: Partial<CreateTemplateInput>): Promise<ApiResponse<DocumentTemplate>> {
  try {
    const template = await templateService.updateTemplate(templateId, updates);
    return { success: true, data: template };
  } catch (e) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : '更新に失敗しました' } };
  }
}
