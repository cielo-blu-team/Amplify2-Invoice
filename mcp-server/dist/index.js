import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { verifyJwt } from './middleware/auth.js';
import { checkRateLimit } from './middleware/rate-limit.js';
import { checkIdempotency, saveIdempotency } from './middleware/idempotency.js';
import { authorize } from './middleware/rbac.js';
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
    name: 'courage-invoice',
    version: '1.0.0',
});
function withAuth(toolFn, permission) {
    return async (args, extra) => {
        try {
            const token = extra.authInfo?.token ?? process.env['DEV_TOKEN'];
            const auth = await verifyJwt(token ?? '');
            const rl = checkRateLimit(auth.userId);
            if (!rl.allowed) {
                throw createErrorResponse('INTERNAL_ERROR', 'レート制限超過');
            }
            if (permission)
                authorize(permission, auth);
            // 冪等性チェック（呼び出し元が idempotencyKey を渡した場合）
            const idempotencyKey = args['idempotencyKey'];
            if (idempotencyKey) {
                const cached = await checkIdempotency(idempotencyKey);
                if (cached !== null) {
                    return {
                        content: [{ type: 'text', text: JSON.stringify(cached) }],
                    };
                }
            }
            const result = await toolFn(args, auth);
            if (idempotencyKey) {
                await saveIdempotency(idempotencyKey, result);
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(result) }],
            };
        }
        catch (e) {
            const err = e;
            return {
                content: [{ type: 'text', text: JSON.stringify(err?.error ?? e) }],
                isError: true,
            };
        }
    };
}
// 読み取り専用ツール（idempotencyKey 不要）
function withAuthReadOnly(toolFn, permission) {
    return async (args, extra) => {
        try {
            const token = extra.authInfo?.token ?? process.env['DEV_TOKEN'];
            const auth = await verifyJwt(token ?? '');
            const rl = checkRateLimit(auth.userId);
            if (!rl.allowed) {
                throw createErrorResponse('INTERNAL_ERROR', 'レート制限超過');
            }
            if (permission)
                authorize(permission, auth);
            const result = await toolFn(args, auth);
            return {
                content: [{ type: 'text', text: JSON.stringify(result) }],
            };
        }
        catch (e) {
            const err = e;
            return {
                content: [{ type: 'text', text: JSON.stringify(err?.error ?? e) }],
                isError: true,
            };
        }
    };
}
// ── 帳票操作ツール ───────────────────────────────────────────────
server.registerTool('create_estimate', {
    description: '見積書を新規作成する。取引先名・件名・明細行を指定してdraft状態の見積書を作成し、帳票IDとサマリを返す。',
    inputSchema: createEstimateSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
}, withAuth(createEstimate, 'document:create'));
server.registerTool('create_invoice', {
    description: '請求書を新規作成する。取引先名・件名・支払期限・明細行を指定してdraft状態の請求書を作成し、帳票IDとサマリを返す。',
    inputSchema: createInvoiceSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
}, withAuth(createInvoice, 'document:create'));
server.registerTool('convert_to_invoice', {
    description: '見積書を請求書に変換する。見積書IDと支払期限を指定して新しい請求書を生成する。元の見積書は confirmed 状態になる。',
    inputSchema: convertToInvoiceSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
}, withAuth(convertToInvoice, 'document:create'));
server.registerTool('get_document', {
    description: '帳票IDを指定して見積書または請求書の詳細情報を取得する。',
    inputSchema: getDocumentSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
}, withAuthReadOnly(getDocument));
server.registerTool('list_documents', {
    description: '帳票一覧を取得する。種別・ステータス・取引先名・期間でフィルタリング可。カーソルベースのページネーション対応。',
    inputSchema: listDocumentsSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
}, withAuthReadOnly(listDocuments));
server.registerTool('update_document', {
    description: 'draft状態の帳票の件名・明細行・備考などを更新する。pending_approval以降のステータスでは更新不可。',
    inputSchema: updateDocumentSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
}, withAuth(updateDocument, 'document:create'));
server.registerTool('delete_document', {
    description: 'draft状態の帳票を論理削除する。pending_approval以降のステータスではSTATUS_CONSTRAINT_ERRORを返す。adminロールのみ実行可。',
    inputSchema: deleteDocumentSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
}, withAuth(deleteDocument, 'document:delete'));
server.registerTool('generate_pdf', {
    description: '帳票IDを指定してPDFを生成またはキャッシュ済みPDFのURLを返す。approved以降のステータスが必要。',
    inputSchema: generatePdfSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
}, withAuth(generatePdf));
server.registerTool('update_status', {
    description: '帳票のステータスを遷移させる。sent/cancelled 遷移は accountant/admin ロールのみ。無効な遷移はINVALID_STATUSエラーを返す。',
    inputSchema: updateStatusSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
}, withAuth(updateStatus));
server.registerTool('approve_document', {
    description: '帳票を承認または否認する。accountant/adminロールのみ実行可。作成者自身は承認不可（四眼原則）。',
    inputSchema: approveDocumentSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
}, withAuth(approveDocument, 'document:approve'));
// ── 取引先操作ツール ──────────────────────────────────────────────
server.registerTool('list_clients', {
    description: '取引先一覧を取得する。名前の部分一致フィルタとカーソルベースのページネーション対応。',
    inputSchema: listClientsSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
}, withAuthReadOnly(listClients));
server.registerTool('create_client', {
    description: '新しい取引先を登録する。名前は必須。メール・電話・住所・担当者名などは任意。accountant/adminロールのみ実行可。',
    inputSchema: createClientSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
}, withAuth(createClient, 'client:create'));
server.registerTool('update_client', {
    description: '取引先IDを指定して取引先情報を更新する。指定したフィールドのみ更新される。accountant/adminロールのみ実行可。',
    inputSchema: updateClientSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
}, withAuth(updateClient, 'client:update'));
// ── 支払・ダッシュボードツール ────────────────────────────────────
server.registerTool('check_payment', {
    description: '請求書IDを指定して入金状況を照合する。銀行データとの突合結果を返す。accountant/adminロールのみ実行可。',
    inputSchema: checkPaymentSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
}, withAuth(checkPayment, 'payment:reconcile'));
server.registerTool('get_dashboard', {
    description: '期間を指定して売上・未収・帳票件数などのダッシュボード集計データを取得する。',
    inputSchema: getDashboardSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
}, withAuthReadOnly(getDashboard));
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Invoice MCP Server started');
}
main().catch(console.error);
//# sourceMappingURL=index.js.map