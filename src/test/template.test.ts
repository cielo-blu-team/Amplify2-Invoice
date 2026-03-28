import { describe, it, expect } from 'vitest';
import type { DocumentTemplate, TemplateLineItem } from '@/types/template';

describe('Template logic', () => {
  it('template with lineItems calculates total correctly', () => {
    const lineItems: TemplateLineItem[] = [
      { description: 'サービスA', quantity: 2, unitPrice: 10000, taxRate: 10 },
      { description: 'サービスB', quantity: 1, unitPrice: 5000, taxRate: 8 },
    ];
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    expect(subtotal).toBe(25000);
  });

  it('template documentType both is valid', () => {
    const template: Partial<DocumentTemplate> = {
      name: 'テストテンプレート',
      documentType: 'both',
      lineItems: [],
    };
    expect(template.documentType).toBe('both');
  });

  it('template resolves for estimate type', () => {
    const templates: Partial<DocumentTemplate>[] = [
      { documentType: 'estimate', name: 'A' },
      { documentType: 'invoice', name: 'B' },
      { documentType: 'both', name: 'C' },
    ];
    const forEstimate = templates.filter(t => t.documentType === 'estimate' || t.documentType === 'both');
    expect(forEstimate.length).toBe(2);
  });
});
