import type { AuthContext } from './auth.js';
/**
 * ロールに基づく権限チェック。不足している場合は McpErrorResponse をスローする。
 */
export declare function authorize(action: string, auth: AuthContext): void;
//# sourceMappingURL=rbac.d.ts.map