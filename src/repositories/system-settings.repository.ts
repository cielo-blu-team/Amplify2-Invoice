import type { SystemSettings } from '@/types';
import { getFirestoreClient } from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

const SETTINGS_DOC_ID = 'global';

export async function getSystemSettings(): Promise<SystemSettings> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.SYSTEM_SETTINGS)
    .doc(SETTINGS_DOC_ID)
    .get();

  if (!snap.exists) {
    return {
      mfSyncEnabled: false,
      aiConfidenceThreshold: 90,
    };
  }
  return snap.data() as SystemSettings;
}

export async function updateSystemSettings(
  updates: Partial<SystemSettings>,
): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.SYSTEM_SETTINGS)
    .doc(SETTINGS_DOC_ID)
    .set(updates, { merge: true });
}
