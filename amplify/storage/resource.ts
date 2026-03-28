import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'invoiceDocuments',
  access: (allow) => ({
    // PDF 保存領域（電子帳簿保存法対応: Object Lock は CDK カスタマイズで設定）
    'documents/*': [allow.authenticated.to(['read', 'write'])],
    // ロゴ・印影画像
    'images/*': [allow.authenticated.to(['read', 'write'])],
    // アーカイブ（Glacier 移行対象）
    'archives/*': [allow.authenticated.to(['read'])],
  }),
});
