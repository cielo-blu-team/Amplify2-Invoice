# CLAUDE.md — Courage Invoice プロジェクト

IS Holdings 向け帳票管理システム（見積書・請求書・経費）。

---

## スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript (strict: true) |
| パッケージマネージャー | **pnpm** (`pnpm add` を使うこと) |
| 認証 | Firebase Authentication (Google / メール+パスワード) |
| DB | Firestore |
| ストレージ | Google Cloud Storage |
| ホスティング | Cloud Run (`courage-invoice`, `asia-northeast1`) |
| GCPプロジェクト | `courage-invoice-prod` |
| CI/CD | GitHub Actions → Cloud Run 自動デプロイ (`main` push) |
| 外部連携 | マネーフォワード クラウド会計 API, Slack Bot, MCP (claude.ai) |

---

## 開発コマンド

```bash
pnpm dev          # ローカル開発サーバー (localhost:3000)
pnpm build        # プロダクションビルド
pnpm lint         # ESLint
pnpm typecheck    # TypeScript型チェック
```

---

## デプロイ

`main` ブランチへの push で GitHub Actions が自動デプロイする。
手動デプロイは不要。デプロイ状況は以下で確認：

```bash
gh run list --repo cielo-blu-team/Amplify2-Invoice --limit=5
```

Cloud Run サービス URL:
- `https://courage-invoice-649548596161.asia-northeast1.run.app`

---

## アーキテクチャ

```
src/
├── app/                  # Next.js App Router
│   ├── api/
│   │   ├── auth/         # Firebase 認証 + MF OAuth エンドポイント
│   │   ├── mcp/          # MCP HTTP エンドポイント（claude.ai 接続用）
│   │   ├── pdf/          # PDF 生成
│   │   ├── health/       # ヘルスチェック
│   │   └── slack/events/ # Slack Events API
│   ├── invoices/         # 請求書画面
│   ├── estimates/        # 見積書画面
│   ├── expenses/         # 経費画面
│   ├── clients/          # 取引先画面
│   ├── projects/         # プロジェクト画面
│   ├── approvals/        # 承認画面
│   ├── payments/         # 支払管理画面
│   ├── analytics/        # 分析画面
│   ├── audit-logs/       # 監査ログ画面
│   ├── dashboard/        # ダッシュボード
│   └── settings/         # 設定画面
├── services/             # ビジネスロジック層 (*.service.ts)
├── repositories/         # Firestore アクセス層 (*.repository.ts)
├── lib/
│   ├── auth.ts           # ロール別認可 (authorize 関数)
│   ├── auth-server.ts    # サーバーサイド認証ヘルパー
│   ├── mf-oauth-client.ts # MF会計 OAuth 2.0 クライアント
│   ├── mcp-tools.ts      # MCP ツール実装（全14ツール）
│   ├── slack-ai-handler.ts # Claude AI 会話型 Slack ハンドラ
│   ├── firebase-admin.ts # Firebase Admin SDK 初期化
│   ├── firebase-client.ts # Firebase Client SDK 初期化
│   └── storage-gcs.ts    # GCS ストレージ操作
└── types/                # 型定義 (document, client, user, etc.)
```

### レイヤー構成

```
App Router (API Route / Page) → Service → Repository → Firestore
```

- **Service 層**: ビジネスロジック。バリデーション、計算、ワークフロー制御
- **Repository 層**: Firestore CRUD のみ。`_firestore-client.ts` で共通初期化
- **型定義**: `src/types/` に集約。ドキュメント型は `document.ts`

---

## 環境変数・Secret Manager マッピング

| 環境変数 | 種別 | Secret Manager キー |
|---|---|---|
| `ANTHROPIC_API_KEY` | secret | `anthropic-api-key` |
| `FIREBASE_API_KEY` | secret | `firebase-api-key` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | secret | `firebase-api-key` |
| `MF_OAUTH_CLIENT_ID` | secret | `mf-oauth-client-id` |
| `MF_OAUTH_CLIENT_SECRET` | secret | `mf-oauth-client-secret` |
| `MF_OAUTH_REFRESH_TOKEN` | secret | `mf-oauth-refresh-token` |
| `SLACK_BOT_TOKEN` | secret | `slack-bot-token` |
| `SLACK_WEBHOOK_URL` | secret | `slack-webhook-url` |
| `GCP_PROJECT_ID` | literal | `courage-invoice-prod` |
| `GCS_BUCKET_NAME` | literal | — |
| `NODE_ENV` | literal | `production` |
| `EMAIL_FROM` | literal | — |

シークレットの更新手順:
```bash
echo -n "NEW_VALUE" | CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 \
  gcloud secrets versions add SECRET_NAME --project=courage-invoice-prod --data-file=-
```

---

## ロール・認可

`src/lib/auth.ts` の `authorize(role, action)` で制御。

ロール階層: `user < accountant < admin`

アクション一覧: `document:read`, `document:create`, `document:update`,
`document:delete`, `document:approve`, `document:send`, `document:cancel`,
`client:create`, `client:update`

---

## MF会計 API 連携

### 認証フロー（OAuth 2.0）
```
/api/auth/mf/start  → MF認可画面へリダイレクト（管理者が初回実行）
/api/auth/mf/callback → 認可コードでトークン取得 → Secret Manager 保存
/api/auth/mf/test → 接続テスト（v2/tenant, biz-admin, enterprise-accounting）
```

### 主要ファイル
- `src/lib/mf-oauth-client.ts` — OAuth クライアント（トークン取得・更新・ローテーション）

### API体系
- 認証基盤: `https://api.biz.moneyforward.com` (/authorize, /token)
- 事業者情報: `https://api.biz.moneyforward.com/v2/tenant`
- 管理コンソール: `https://api.biz-admin.moneyforward.com/v1/`
- 会計Plus: `https://api-enterprise-accounting.moneyforward.com/api/v3/`

### スコープ
```
mfc/admin/tenant.read                     # 事業者情報（全プラン共通）
mfc/biz-admin/tenant.service.read         # 利用中サービス確認
mfc/enterprise-accounting/journal.read    # 会計Plus 仕訳
mfc/enterprise-accounting/master.read     # 会計Plus マスタ
mfc/enterprise-accounting/office.read     # 会計Plus 事業者情報
mfc/enterprise-accounting/report.read     # 会計Plus 帳票
```

### トークン管理
- アクセストークン: メモリキャッシュ（有効期限5分前に更新）
- リフレッシュトークン: Secret Manager に自動ローテーション保存
- Cloud Run SA (`invoice-cloud-run@courage-invoice-prod.iam.gserviceaccount.com`) に `secretmanager.secretVersionAdder` 権限付与済み

### 詳細ドキュメント
→ `docs/mf-api-investigation.md`

---

## MCP エンドポイント

`POST /api/mcp` — claude.ai カスタムコネクタ用（OAuth 不要）

- 認証: なし（claude.ai がカスタムヘッダー非対応のため）
- 認可: `MCP_SYSTEM_ROLE` 環境変数でロール制御（デフォルト: `admin`）
- ツール数: 14（見積/請求書 CRUD・承認・PDF生成・ダッシュボードなど）

ロール権限表:

| 操作 | user | accountant | admin |
|---|---|---|---|
| 読み取り（一覧・詳細） | o | o | o |
| 作成・更新 | x | o | o |
| 削除 | x | x | o |
| 承認・否認 | x | x | o |
| 送付・キャンセル | x | o | o |

---

## Slack ボット

Slack App: **Courage Invoice**（ワークスペース: ish-courage）
イベントエンドポイント: `POST /api/slack/events`

### 動作フロー
1. チャンネルで `@Courage Invoice <メッセージ>` でメンション
2. ボットが Claude Haiku を使って会話を進める
3. 情報が揃ったら自動でツールを実行（帳票作成・検索など）
4. 返信はすべてスレッドに投稿
5. スレッド内ではメンションなしで継続会話可能（会話 TTL: 30 分）

### 購読イベント
- `app_mention` — メンション
- `message.im` — DM
- `message.channels` — チャンネル内メッセージ（スレッド継続用）

---

## ログ監視

```bash
CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 \
  gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="courage-invoice"' \
  --project=courage-invoice-prod --limit=50 --format=json
```

WARNING 以上のみ:
```bash
... AND severity>=WARNING
```
