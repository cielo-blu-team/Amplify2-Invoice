import * as clientService from '@/services/client.service';
import type { Client } from '@/types';

export async function getClients(
  keyword?: string,
  limit?: number,
  cursor?: string
): Promise<{ items: Client[]; cursor?: string }> {
  if (keyword) {
    return clientService.searchClients(keyword, limit, cursor);
  }
  return clientService.listClients(limit, cursor);
}

export async function getClient(clientId: string): Promise<Client | null> {
  return clientService.getClient(clientId);
}
