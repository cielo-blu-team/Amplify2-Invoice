import type { Project } from '@/types';
import {
  getFirestoreClient,
  applyCursorToQuery,
  generateNextCursor,
  stripLegacyFields,
  withUpdatedAt,
} from './_firestore-client';
import { COLLECTIONS } from '@/lib/constants';

export async function getProjectById(projectId: string): Promise<Project | null> {
  const snap = await getFirestoreClient().collection(COLLECTIONS.PROJECTS).doc(projectId).get();
  if (!snap.exists) return null;
  return { ...snap.data(), projectId: snap.id } as Project;
}

export async function createProject(data: Project): Promise<void> {
  const db = getFirestoreClient();
  const docRef = db.collection(COLLECTIONS.PROJECTS).doc(data.projectId);

  await db.runTransaction(async (tx) => {
    if ((await tx.get(docRef)).exists) throw new Error(`Project ${data.projectId} already exists`);
    tx.set(docRef, stripLegacyFields(data, 'projectId'));
  });
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.PROJECTS)
    .doc(projectId)
    .update(withUpdatedAt(stripLegacyFields(updates, 'projectId')));
}

export async function softDeleteProject(projectId: string): Promise<void> {
  await getFirestoreClient()
    .collection(COLLECTIONS.PROJECTS)
    .doc(projectId)
    .update(withUpdatedAt({ isDeleted: true }));
}

export async function listProjects(
  limit?: number,
  cursor?: string,
  statusFilter?: string,
): Promise<{ items: Project[]; cursor?: string }> {
  const pageSize = limit ?? 50;

  let query = getFirestoreClient()
    .collection(COLLECTIONS.PROJECTS)
    .where('isDeleted', '==', false)
    .orderBy('createdAt', 'desc') as FirebaseFirestore.Query;

  if (statusFilter) query = query.where('status', '==', statusFilter);

  query = await applyCursorToQuery(query, COLLECTIONS.PROJECTS, cursor);

  const snap = await query.limit(pageSize).get();
  return {
    items: snap.docs.map((d) => ({ ...d.data(), projectId: d.id }) as Project),
    cursor: generateNextCursor(snap.docs, pageSize),
  };
}
