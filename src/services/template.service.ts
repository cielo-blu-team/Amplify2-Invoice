// src/services/template.service.ts
// テンプレートCRUDサービス（Firestore版）
// Firestore: settings/templates/{templateId} として保存

import { getFirestoreClient } from '@/repositories/_firestore-client';
import type { DocumentTemplate, CreateTemplateInput } from '@/types/template';

const TEMPLATES_COLLECTION = 'templates';

class TemplateService {
  async createTemplate(input: CreateTemplateInput, createdBy: string): Promise<DocumentTemplate> {
    const db = getFirestoreClient();
    const templateId = crypto.randomUUID();
    const now = new Date().toISOString();
    const template: DocumentTemplate = {
      templateId,
      ...input,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(TEMPLATES_COLLECTION).doc(templateId).set(template);
    return template;
  }

  async getTemplate(templateId: string): Promise<DocumentTemplate | null> {
    const db = getFirestoreClient();
    const snap = await db.collection(TEMPLATES_COLLECTION).doc(templateId).get();
    if (!snap.exists) return null;
    return snap.data() as DocumentTemplate;
  }

  async listTemplates(documentType?: 'estimate' | 'invoice' | 'both'): Promise<DocumentTemplate[]> {
    const db = getFirestoreClient();
    let query: FirebaseFirestore.Query = db.collection(TEMPLATES_COLLECTION);

    if (documentType && documentType !== 'both') {
      query = query.where('documentType', 'in', [documentType, 'both']);
    }

    const snap = await query.get();
    return snap.docs.map((d) => d.data() as DocumentTemplate);
  }

  async updateTemplate(templateId: string, updates: Partial<CreateTemplateInput>): Promise<DocumentTemplate> {
    const db = getFirestoreClient();
    const existing = await this.getTemplate(templateId);
    if (!existing) throw new Error('テンプレートが見つかりません');

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await db.collection(TEMPLATES_COLLECTION).doc(templateId).set(updated);
    return updated;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const db = getFirestoreClient();
    await db.collection(TEMPLATES_COLLECTION).doc(templateId).delete();
  }
}

export const templateService = new TemplateService();
