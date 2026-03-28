// src/types/template.ts
export interface DocumentTemplate {
  templateId: string;
  name: string;
  documentType: 'estimate' | 'invoice' | 'both';
  subject?: string;
  notes?: string;
  lineItems: TemplateLineItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: 10 | 8 | 0;
  unit?: string;
}

export interface CreateTemplateInput {
  name: string;
  documentType: 'estimate' | 'invoice' | 'both';
  subject?: string;
  notes?: string;
  lineItems: TemplateLineItem[];
}
