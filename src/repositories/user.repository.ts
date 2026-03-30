import type { User, Role } from '@/types';
import { getFirestoreClient, stripLegacyFields, withUpdatedAt } from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

export async function getUserById(userId: string): Promise<User | null> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.USERS).doc(userId).get();
  if (!snap.exists) return null;
  return { ...snap.data(), userId: snap.id } as User;
}

export async function getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.USERS)
    .where('firebaseUid', '==', firebaseUid)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ...doc.data(), userId: doc.id } as User;
}

// 後方互換エイリアス
export const getUserByCognitoSub = getUserByFirebaseUid;

export async function createUser(user: User): Promise<void> {
  const db = getFirestoreClient();
  const docRef = db.collection(COLLECTIONS.USERS).doc(user.userId);

  await db.runTransaction(async (tx) => {
    if ((await tx.get(docRef)).exists) throw new Error(`User ${user.userId} already exists`);
    tx.set(docRef, stripLegacyFields(user, 'userId'));
  });
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.USERS)
    .doc(userId)
    .update(withUpdatedAt(stripLegacyFields(updates, 'userId')));
}

export async function listUsers(): Promise<User[]> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.USERS).get();
  return snap.docs.map((d) => ({ ...d.data(), userId: d.id }) as User);
}

export async function listUsersByRole(role: Role): Promise<User[]> {
  const snap = await getFirestoreClient()
    .collection(COLLECTIONS.USERS)
    .where('role', '==', role)
    .get();
  return snap.docs.map((d) => ({ ...d.data(), userId: d.id }) as User);
}
