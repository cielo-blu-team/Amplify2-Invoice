import { z } from 'zod';
import { apiCall } from '../lib/api-client.js';
export const getDashboardSchema = z.object({
    fromDate: z.string().optional().describe('集計開始日 YYYY-MM-DD'),
    toDate: z.string().optional().describe('集計終了日 YYYY-MM-DD'),
});
export async function getDashboard(args, auth) {
    const params = new URLSearchParams();
    if (args.fromDate)
        params.set('fromDate', args.fromDate);
    if (args.toDate)
        params.set('toDate', args.toDate);
    const query = params.toString();
    const path = `/api/mcp/dashboard${query ? `?${query}` : ''}`;
    return apiCall(path, 'GET', undefined, auth.token);
}
//# sourceMappingURL=get-dashboard.js.map