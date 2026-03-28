import { v4 as uuidv4 } from 'uuid';
import * as clientRepo from '@/repositories/client.repository';
import type { Client, ClientCreateInput } from '@/types';

// 取引先作成
export async function createClient(input: ClientCreateInput): Promise<Client> {
  const clientId = uuidv4();
  const now = new Date().toISOString();

  const clientData: Client = {
    PK: `CLIENT#${clientId}`,
    SK: 'META',
    clientId,
    clientName: input.clientName,
    clientNameKana: input.clientNameKana ?? '',
    businessType: input.businessType,
    registrationNumber: input.registrationNumber,
    postalCode: input.postalCode,
    prefecture: input.prefecture,
    address: input.address,
    building: input.building,
    phone: input.phone,
    fax: input.fax,
    email: input.email,
    contactPerson: input.contactPerson,
    contactEmail: input.contactEmail,
    closingDay: input.closingDay,
    paymentTerms: input.paymentTerms,
    notes: input.notes,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  await clientRepo.createClient(clientData);
  return clientData;
}

// 取引先更新
export async function updateClient(
  clientId: string,
  updates: Partial<ClientCreateInput>
): Promise<Client> {
  const existing = await clientRepo.getClientById(clientId);
  if (!existing) {
    throw new Error(`Client not found: ${clientId}`);
  }

  await clientRepo.updateClient(clientId, updates);

  const updated = await clientRepo.getClientById(clientId);
  if (!updated) {
    throw new Error(`Client not found after update: ${clientId}`);
  }
  return updated;
}

// 取引先論理削除
export async function deleteClient(clientId: string): Promise<void> {
  const existing = await clientRepo.getClientById(clientId);
  if (!existing) {
    throw new Error(`Client not found: ${clientId}`);
  }
  await clientRepo.softDeleteClient(clientId);
}

// 取引先取得
export async function getClient(clientId: string): Promise<Client | null> {
  return clientRepo.getClientById(clientId);
}

// 取引先検索
export async function searchClients(
  keyword: string,
  limit?: number,
  cursor?: string
): Promise<{ items: Client[]; cursor?: string }> {
  return clientRepo.searchClients(keyword, limit, cursor);
}

// 取引先一覧
export async function listClients(
  limit?: number,
  cursor?: string
): Promise<{ items: Client[]; cursor?: string }> {
  return clientRepo.listClients(limit, cursor);
}
