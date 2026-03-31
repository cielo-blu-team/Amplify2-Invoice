import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
export const generatePdfSchema = z.object({
    documentId: z.string().describe('帳票ID'),
});
export async function generatePdf(args, auth) {
    return apiCall(`/api/mcp/documents/${args.documentId}/pdf`, 'POST', undefined, auth.token);
}
//# sourceMappingURL=generate-pdf.js.map