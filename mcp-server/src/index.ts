import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { verifyJwt } from './middleware/auth.js';
import { checkRateLimit } from './middleware/rate-limit.js';
import { createErrorResponse } from './errors.js';

import { createEstimate, createEstimateSchema } from './tools/create-estimate.js';
import { createInvoice, createInvoiceSchema } from './tools/create-invoice.js';
import { convertToInvoice, convertToInvoiceSchema } from './tools/convert-to-invoice.js';
import { getDocument, getDocumentSchema } from './tools/get-document.js';
import { listDocuments, listDocumentsSchema } from './tools/list-documents.js';
import { updateDocument, updateDocumentSchema } from './tools/update-document.js';
import { deleteDocument, deleteDocumentSchema } from './tools/delete-document.js';
import { generatePdf, generatePdfSchema } from './tools/generate-pdf.js';
import { updateStatus, updateStatusSchema } from './tools/update-status.js';
import { approveDocument, approveDocumentSchema } from './tools/approve-document.js';
import { listClients, listClientsSchema } from './tools/list-clients.js';
import { createClient, createClientSchema } from './tools/create-client.js';
import { updateClient, updateClientSchema } from './tools/update-client.js';
import { checkPayment, checkPaymentSchema } from './tools/check-payment.js';
import { getDashboard, getDashboardSchema } from './tools/get-dashboard.js';

const server = new McpServer({
  name: 'amplify2-invoice',
  version: '1.0.0',
});

type ToolFn<T> = (args: T, auth: ReturnType<typeof verifyJwt> extends Promise<infer R> ? R : never) => Promise<unknown>;

function withAuth<T>(toolFn: ToolFn<T>) {
  return async (args: T, extra: Record<string, unknown>) => {
    try {
      const authInfo = extra?.authInfo as { token?: string } | undefined;
      const token = authInfo?.token ?? process.env.DEV_TOKEN;
      const auth = await verifyJwt(token ?? '');
      const rl = checkRateLimit(auth.userId);
      if (!rl.allowed) {
        throw createErrorResponse('INTERNAL_ERROR', 'レート制限超過');
      }
      const result = await toolFn(args, auth);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      };
    } catch (e: unknown) {
      const err = e as { error?: unknown } | null;
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(err?.error ?? e) }],
        isError: true,
      };
    }
  };
}

// Register all 15 tools
server.tool('create-estimate', createEstimateSchema, withAuth(createEstimate));
server.tool('create-invoice', createInvoiceSchema, withAuth(createInvoice));
server.tool('convert-to-invoice', convertToInvoiceSchema, withAuth(convertToInvoice));
server.tool('get-document', getDocumentSchema, withAuth(getDocument));
server.tool('list-documents', listDocumentsSchema, withAuth(listDocuments));
server.tool('update-document', updateDocumentSchema, withAuth(updateDocument));
server.tool('delete-document', deleteDocumentSchema, withAuth(deleteDocument));
server.tool('generate-pdf', generatePdfSchema, withAuth(generatePdf));
server.tool('update-status', updateStatusSchema, withAuth(updateStatus));
server.tool('approve-document', approveDocumentSchema, withAuth(approveDocument));
server.tool('list-clients', listClientsSchema, withAuth(listClients));
server.tool('create-client', createClientSchema, withAuth(createClient));
server.tool('update-client', updateClientSchema, withAuth(updateClient));
server.tool('check-payment', checkPaymentSchema, withAuth(checkPayment));
server.tool('get-dashboard', getDashboardSchema, withAuth(getDashboard));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Invoice MCP Server started');
}

main().catch(console.error);
