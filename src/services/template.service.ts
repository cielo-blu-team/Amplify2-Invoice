// src/services/template.service.ts
// テンプレートCRUDサービス
// DynamoDB Settings テーブル内のTEMPLATE#{id}として保存

import { docClient } from '@/lib/dynamo';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { DocumentTemplate, CreateTemplateInput } from '@/types/template';

const TABLE = process.env.DYNAMODB_TABLE ?? 'InvoiceTable';

class TemplateService {
  async createTemplate(input: CreateTemplateInput, createdBy: string): Promise<DocumentTemplate> {
    const templateId = crypto.randomUUID();
    const now = new Date().toISOString();
    const template: DocumentTemplate = {
      templateId,
      ...input,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: 'TEMPLATES',
        SK: `TEMPLATE#${templateId}`,
        ...template,
      },
    }));
    return template;
  }

  async getTemplate(templateId: string): Promise<DocumentTemplate | null> {
    const res = await docClient.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: 'TEMPLATES', SK: `TEMPLATE#${templateId}` },
    }));
    if (!res.Item) return null;
    const { PK: _PK, SK: _SK, ...data } = res.Item as { PK: string; SK: string } & DocumentTemplate;
    return data as DocumentTemplate;
  }

  async listTemplates(documentType?: 'estimate' | 'invoice' | 'both'): Promise<DocumentTemplate[]> {
    const res = await docClient.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': 'TEMPLATES', ':sk': 'TEMPLATE#' },
    }));
    const items = (res.Items ?? []).map(({ PK: _PK, SK: _SK, ...data }) => data as DocumentTemplate);
    if (documentType) {
      return items.filter(t => t.documentType === documentType || t.documentType === 'both');
    }
    return items;
  }

  async updateTemplate(templateId: string, updates: Partial<CreateTemplateInput>): Promise<DocumentTemplate> {
    const existing = await this.getTemplate(templateId);
    if (!existing) throw new Error('テンプレートが見つかりません');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await docClient.send(new PutCommand({
      TableName: TABLE,
      Item: { PK: 'TEMPLATES', SK: `TEMPLATE#${templateId}`, ...updated },
    }));
    return updated;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLE,
      Key: { PK: 'TEMPLATES', SK: `TEMPLATE#${templateId}` },
    }));
  }
}

export const templateService = new TemplateService();
