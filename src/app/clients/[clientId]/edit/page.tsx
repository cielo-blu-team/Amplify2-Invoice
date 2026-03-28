import { notFound } from 'next/navigation';
import { getClient } from '@/queries/client';
import ClientEditClient from './ClientEditClient';

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientEditPage({ params }: Props) {
  const { clientId } = await params;
  const client = await getClient(clientId);

  if (!client || client.isDeleted) {
    notFound();
  }

  return <ClientEditClient client={client} />;
}
