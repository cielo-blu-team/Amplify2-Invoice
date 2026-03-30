import type { CompanySettings } from '@/types';
import { getFirestoreClient } from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

export async function getCompanySettings(): Promise<CompanySettings | null> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.SETTINGS).doc('company').get();
  if (!snap.exists) return null;
  return snap.data() as CompanySettings;
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  await getFirestoreClient().collection(COLLECTIONS.SETTINGS).doc('company').set(settings);
}
