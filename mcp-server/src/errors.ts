// MCPエラーコード（要件定義書 5.5.2）
export type McpErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INVALID_STATUS'
  | 'STATUS_CONSTRAINT_ERROR'
  | 'DUPLICATE_REQUEST'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR';

export interface McpErrorResponse {
  error: {
    code: McpErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function createErrorResponse(
  code: McpErrorCode,
  message: string,
  details?: Record<string, unknown>,
): McpErrorResponse {
  return { error: { code, message, details } };
}
