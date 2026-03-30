import { getCurrentUserId } from '@/lib/auth-server';
import NewInvoiceClient from './NewInvoiceClient';

export default async function InvoiceNewPage() {
  const userId = await getCurrentUserId();
  return <NewInvoiceClient userId={userId} />;
}
