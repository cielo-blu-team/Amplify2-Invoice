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

export interface SlackChannelConfig {
  approvalChannel: string;
  alertChannel: string;
  paymentChannel: string;
  generalChannel: string;
}

export async function getSlackChannelConfig(): Promise<SlackChannelConfig | null> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.SETTINGS).doc('slack-channels').get();
  if (!snap.exists) return null;
  return snap.data() as SlackChannelConfig;
}

export async function saveSlackChannelConfig(config: SlackChannelConfig): Promise<void> {
  await getFirestoreClient().collection(COLLECTIONS.SETTINGS).doc('slack-channels').set(config);
}
