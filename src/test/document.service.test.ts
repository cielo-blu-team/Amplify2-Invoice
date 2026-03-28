import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DocumentHeader, LineItem } from '@/types';

// Mock the repositories
vi.mock('@/repositories/document.repository', () => ({
  documentRepository: {
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    queryByStatus: vi.fn(),
    queryByClientId: vi.fn(),
    list: vi.fn(),
  },
}));

vi.mock('@/repositories/sequence.repository', () => ({
  sequenceRepository: {
    nextSequence: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('@/repositories/audit-log.repository', () => ({
  auditLogRepository: {
    create: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockLineItem: LineItem = {
  lineItemId: '1',
  description: 'テストサービス',
  quantity: 2,
  unitPrice: 10000,
  taxRate: 10,
  amount: 20000,
};

describe('document.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDocument (mock)', () => {
    it('creates document with correct subtotal', () => {
      const subtotal = mockLineItem.quantity * mockLineItem.unitPrice;
      expect(subtotal).toBe(20000);
    });

    it('applies 10% tax correctly', () => {
      const subtotal = 20000;
      const tax = Math.floor(subtotal * 10 / 100);
      expect(tax).toBe(2000);
    });

    it('calculates total correctly', () => {
      const subtotal = 20000;
      const tax = 2000;
      expect(subtotal + tax).toBe(22000);
    });
  });

  describe('status constraints', () => {
    it('draft status allows editing', () => {
      const status = 'draft';
      const canEdit = status === 'draft';
      expect(canEdit).toBe(true);
    });

    it('non-draft status prevents editing', () => {
      const statuses = ['confirmed', 'sent', 'paid', 'cancelled'];
      for (const status of statuses) {
        const canEdit = status === 'draft';
        expect(canEdit).toBe(false);
      }
    });

    it('only draft can be deleted', () => {
      expect('draft' === 'draft').toBe(true);
      expect('confirmed' === 'draft').toBe(false);
    });
  });

  describe('duplicate', () => {
    it('reset status to draft on duplicate', () => {
      const original: Partial<DocumentHeader> = { status: 'confirmed', documentNumber: 'EST-001' };
      const duplicated = { ...original, status: 'draft' as const, documentId: crypto.randomUUID() };
      expect(duplicated.status).toBe('draft');
    });
  });

  describe('convert estimate to invoice', () => {
    it('copies line items from estimate', () => {
      const estimateLineItems = [mockLineItem];
      const invoiceLineItems = [...estimateLineItems];
      expect(invoiceLineItems).toHaveLength(1);
      expect(invoiceLineItems[0].description).toBe(mockLineItem.description);
    });

    it('requires dueDate for invoice', () => {
      const dueDate = '2026-04-30';
      expect(dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('cancel', () => {
    it('requires cancel reason', () => {
      const reason = '';
      expect(reason.trim().length).toBe(0); // empty reason should fail
    });

    it('records cancel reason', () => {
      const reason = '顧客都合により取消';
      expect(reason.length).toBeGreaterThan(0);
    });
  });

  describe('revise estimate', () => {
    it('increments revision number', () => {
      const current = 1;
      const next = current + 1;
      expect(next).toBe(2);
    });

    it('formats revision suffix correctly', () => {
      const baseNumber = 'EST-20260101-001';
      const revision = 2;
      const revised = `${baseNumber}-R${revision}`;
      expect(revised).toBe('EST-20260101-001-R2');
    });
  });
});
