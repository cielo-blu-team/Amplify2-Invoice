import { createErrorResponse } from '../errors.js';
const permissions = {
    'document:create': ['user', 'accountant', 'admin'],
    'document:approve': ['accountant', 'admin'],
    'document:send': ['accountant', 'admin'],
    'document:cancel': ['accountant', 'admin'],
    'document:delete': ['admin'],
    'client:create': ['accountant', 'admin'],
    'client:update': ['accountant', 'admin'],
    'payment:reconcile': ['accountant', 'admin'],
};
/**
 * ロールに基づく権限チェック。不足している場合は McpErrorResponse をスローする。
 */
export function authorize(action, auth) {
    const allowed = permissions[action];
    if (allowed && !allowed.includes(auth.role)) {
        throw createErrorResponse('PERMISSION_DENIED', `この操作には ${action} 権限が必要です。現在のロール: ${auth.role}`, { requiredPermission: action, currentRole: auth.role });
    }
}
//# sourceMappingURL=rbac.js.map