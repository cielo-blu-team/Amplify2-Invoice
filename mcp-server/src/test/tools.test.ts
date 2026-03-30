import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = { userId: 'u1', email: 'u@e.com', role: 'admin' as const, token: 'test-token' };

// mock fetch globally
global.fetch = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
});

describe('create-estimate', () => {
  it('valid input returns success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documentId: 'DOC-001' }),
    });
    const { createEstimate } = await import('../tools/create-estimate.js');
    const result = await createEstimate(
      {
        clientName: '株式会社テスト',
        subject: 'テスト見積',
        issueDate: '2026-01-01',
        lineItems: [{ description: 'サービス', quantity: 1, unitPrice: 10000, taxRate: 10 }],
      },
      mockAuth,
    );
    expect(result).toBeDefined();
  });

  it('API error throws', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({ message: 'バリデーションエラー' }),
    });
    const { createEstimate } = await import('../tools/create-estimate.js');
    await expect(
      createEstimate(
        {
          clientName: 'テスト',
          subject: '件名',
          issueDate: '2026-01-01',
          lineItems: [],
        },
        mockAuth,
      ),
    ).rejects.toBeDefined();
  });
});

describe('create-invoice', () => {
  it('valid input returns success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documentId: 'INV-001' }),
    });
    const { createInvoice } = await import('../tools/create-invoice.js');
    const result = await createInvoice(
      {
        clientName: '株式会社テスト',
        subject: 'テスト請求',
        issueDate: '2026-01-01',
        dueDate: '2026-01-31',
        lineItems: [{ description: 'サービス', quantity: 1, unitPrice: 10000, taxRate: 10 }],
      },
      mockAuth,
    );
    expect(result).toBeDefined();
  });
});

describe('convert-to-invoice', () => {
  it('converts estimate to invoice', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documentId: 'INV-002', documentType: 'invoice' }),
    });
    const { convertToInvoice } = await import('../tools/convert-to-invoice.js');
    const result = await convertToInvoice(
      { documentId: 'EST-001', dueDate: '2026-02-28' },
      mockAuth,
    );
    expect(result).toBeDefined();
  });
});

describe('get-document', () => {
  it('returns document by id', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documentId: 'DOC-001', subject: 'テスト' }),
    });
    const { getDocument } = await import('../tools/get-document.js');
    const result = await getDocument({ documentId: 'DOC-001' }, mockAuth);
    expect(result).toBeDefined();
  });
});

describe('list-documents', () => {
  it('returns list without filters', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], cursor: undefined }),
    });
    const { listDocuments } = await import('../tools/list-documents.js');
    const result = await listDocuments({}, mockAuth);
    expect(result).toBeDefined();
  });

  it('passes filters as query params', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });
    const { listDocuments } = await import('../tools/list-documents.js');
    await listDocuments(
      { documentType: 'estimate', clientName: '株式会社テスト', limit: 10 },
      mockAuth,
    );
    const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('documentType=estimate');
    expect(callUrl).toContain('clientName=');
  });
});

describe('update-document', () => {
  it('updates document fields', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documentId: 'DOC-001', subject: '更新後件名' }),
    });
    const { updateDocument } = await import('../tools/update-document.js');
    const result = await updateDocument(
      { documentId: 'DOC-001', subject: '更新後件名' },
      mockAuth,
    );
    expect(result).toBeDefined();
  });
});

describe('delete-document', () => {
  it('deletes document', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    const { deleteDocument } = await import('../tools/delete-document.js');
    const result = await deleteDocument({ documentId: 'DOC-001' }, mockAuth);
    expect(result).toBeDefined();
  });
});

describe('generate-pdf', () => {
  it('generates pdf for document', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ pdfUrl: 'https://example.com/doc.pdf' }),
    });
    const { generatePdf } = await import('../tools/generate-pdf.js');
    const result = await generatePdf({ documentId: 'DOC-001' }, mockAuth);
    expect(result).toBeDefined();
  });
});

describe('update-status', () => {
  it('updates document status', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documentId: 'DOC-001', status: 'confirmed' }),
    });
    const { updateStatus } = await import('../tools/update-status.js');
    const result = await updateStatus(
      { documentId: 'DOC-001', newStatus: 'confirmed' },
      mockAuth,
    );
    expect(result).toBeDefined();
  });
});

describe('approve-document', () => {
  it('approves document', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documentId: 'DOC-001', status: 'approved' }),
    });
    const { approveDocument } = await import('../tools/approve-document.js');
    const result = await approveDocument(
      { documentId: 'DOC-001', action: 'approve', comment: '問題なし' },
      mockAuth,
    );
    expect(result).toBeDefined();
  });

  it('rejects document', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documentId: 'DOC-001', status: 'rejected' }),
    });
    const { approveDocument } = await import('../tools/approve-document.js');
    const result = await approveDocument(
      { documentId: 'DOC-001', action: 'reject', comment: '金額が間違っています' },
      mockAuth,
    );
    expect(result).toBeDefined();
  });
});

describe('list-clients', () => {
  it('returns list of clients', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });
    const { listClients } = await import('../tools/list-clients.js');
    const result = await listClients({}, mockAuth);
    expect(result).toBeDefined();
  });
});

describe('create-client', () => {
  it('creates a new client', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ clientId: 'CLT-001', name: '株式会社新規' }),
    });
    const { createClient } = await import('../tools/create-client.js');
    const result = await createClient(
      { name: '株式会社新規', email: 'contact@example.com' },
      mockAuth,
    );
    expect(result).toBeDefined();
  });
});

describe('update-client', () => {
  it('updates client info', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ clientId: 'CLT-001', name: '株式会社更新済み' }),
    });
    const { updateClient } = await import('../tools/update-client.js');
    const result = await updateClient(
      { clientId: 'CLT-001', name: '株式会社更新済み' },
      mockAuth,
    );
    expect(result).toBeDefined();
  });
});

describe('check-payment', () => {
  it('checks payment status', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invoiceId: 'INV-001', paid: false }),
    });
    const { checkPayment } = await import('../tools/check-payment.js');
    const result = await checkPayment({ invoiceId: 'INV-001' }, mockAuth);
    expect(result).toBeDefined();
  });
});

describe('get-dashboard', () => {
  it('returns dashboard data', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totalRevenue: 0, pendingCount: 0 }),
    });
    const { getDashboard } = await import('../tools/get-dashboard.js');
    const result = await getDashboard({}, mockAuth);
    expect(result).toBeDefined();
  });

  it('passes date filters', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totalRevenue: 1000000 }),
    });
    const { getDashboard } = await import('../tools/get-dashboard.js');
    await getDashboard({ fromDate: '2026-01-01', toDate: '2026-03-31' }, mockAuth);
    const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('fromDate=2026-01-01');
  });
});
