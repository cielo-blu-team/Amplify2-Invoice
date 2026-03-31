import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
export const getDocumentSchema = z.object({
    documentId: z.string().describe('帳票ID'),
});
export async function getDocument(args, auth) {
    return apiCall(`/api/mcp/documents/${args.documentId}`, 'GET', undefined, auth.token);
}
//# sourceMappingURL=get-document.js.map