import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
export const deleteDocumentSchema = z.object({
    documentId: z.string().describe('帳票ID'),
});
export async function deleteDocument(args, auth) {
    return apiCall(`/api/mcp/documents/${args.documentId}`, 'DELETE', undefined, auth.token);
}
//# sourceMappingURL=delete-document.js.map