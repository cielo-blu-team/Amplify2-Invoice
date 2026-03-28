'use server';

import * as clientService from '@/services/client.service';
import { clientCreateSchema, clientUpdateSchema } from '@/schemas/client.schema';
import type { ApiResponse, Client } from '@/types';

export async function createClient(input: unknown): Promise<ApiResponse<Client>> {
  try {
    const parsed = clientCreateSchema.safeParse(input);
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
    const client = await clientService.createClient(parsed.data);
    return { success: true, data: client };
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

export async function updateClient(
  clientId: string,
  input: unknown
): Promise<ApiResponse<Client>> {
  try {
    const parsed = clientUpdateSchema.safeParse(input);
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
    const { clientId: _id, ...updates } = parsed.data;
    const client = await clientService.updateClient(clientId, updates);
    return { success: true, data: client };
  } catch (err) {
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    if (message.includes('not found')) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message },
      };
    }
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    };
  }
}

export async function listClients(
  keyword?: string,
  limit?: number,
  cursor?: string
): Promise<ApiResponse<{ items: Client[]; cursor?: string }>> {
  try {
    const result = keyword
      ? await clientService.searchClients(keyword, limit, cursor)
      : await clientService.listClients(limit, cursor);
    return { success: true, data: result };
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

export async function deleteClient(clientId: string): Promise<ApiResponse<void>> {
  try {
    await clientService.deleteClient(clientId);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    if (message.includes('not found')) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message },
      };
    }
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    };
  }
}
