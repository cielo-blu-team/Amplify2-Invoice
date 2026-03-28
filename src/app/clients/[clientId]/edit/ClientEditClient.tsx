'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateClient } from '@/actions/client';
import ClientForm from '@/components/clients/ClientForm';
import { showError, showSuccess } from '@/lib/toast';
import type { Client, ClientCreateInput } from '@/types';

interface Props {
  client: Client;
}

export default function ClientEditClient({ client }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ClientCreateInput) => {
    setLoading(true);
    try {
      const result = await updateClient(client.clientId, { ...data, clientId: client.clientId });
      if (!result.success) {
        showError(result.error.message);
      } else {
        showSuccess('取引先情報を更新しました');
        router.push('/clients');
      }
    } catch {
      showError('予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">取引先 編集</h1>
        <ClientForm initialData={client} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
