import { getCurrentUserId } from '@/lib/auth-server';
import NewEstimateClient from './NewEstimateClient';

export default async function EstimateNewPage() {
  const userId = await getCurrentUserId();
  return <NewEstimateClient userId={userId} />;
}
