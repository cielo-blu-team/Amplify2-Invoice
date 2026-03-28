'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/actions/client';
import ClientForm from '@/components/clients/ClientForm';
import { showError, showSuccess } from '@/lib/toast';
import type { ClientCreateInput } from '@/types';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ClientCreateInput) => {
    setLoading(true);
    try {
      const result = await createClient(data);
      if (!result.success) {
        showError(result.error.message);
      } else {
        showSuccess('取引先を登録しました');
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
      <h2 className="text-xl font-bold text-zinc-900">取引先 新規登録</h2>
      <ClientForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
