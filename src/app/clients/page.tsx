export const dynamic = 'force-dynamic';

import { getClients } from '@/queries/client';
import ClientListClient from './ClientListClient';

export default async function ClientsPage() {
  const result = await getClients(undefined, 50).catch(() => ({ items: [], nextCursor: undefined }));
  return <ClientListClient initialData={result} />;
}
