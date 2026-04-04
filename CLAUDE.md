# CLAUDE.md — Courage Invoice プロジェクト

IS Holdings 向け帳票管理システム（見積書・請求書）。

---

## スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| パッケージマネージャー | **pnpm** (`pnpm add` を使うこと) |
| 認証 | Firebase Authentication (Google / メール+パスワード) |
| DB | Firestore |
| ストレージ | Google Cloud Storage |
| ホスティング | Cloud Run (`courage-invoice`, `asia-northeast1`) |
| GCPプロジェクト | `courage-invoice-prod` |
| CI/CD | GitHub Actions → Cloud Run 自動デプロイ |

---

## デプロイ

`main` ブランチへの push で GitHub Actions が自動デプロイする。
手動デプロイは不要。デプロイ状況は以下で確認：

```bash
gh run list --repo cielo-blu-team/Amplify2-Invoice --limit=5
```

Cloud Run サービス URL:
- `https://courage-invoice-uy4whq3gaa-an.a.run.app`（旧）
- `https://courage-invoice-649548596161.asia-northeast1.run.app`（新）

---

## 環境変数・Secret Manager マッピング

| 環境変数 | 種別 | Secret Manager キー |
|---|---|---|
| `ANTHROPIC_API_KEY` | secret | `anthropic-api-key` |
| `FIREBASE_API_KEY` | secret | `firebase-api-key` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | secret | `firebase-api-key` |
| `MONEYFORWARD_API_KEY` | secret | `moneyforward-api-key` |
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

## アーキテクチャ

```
src/
├── app/                  # Next.js App Router
│   ├── api/
│   │   ├── auth/         # Firebase 認証エンドポイント
│   │   ├── mcp/          # MCP HTTP エンドポイント（claude.ai 接続用）
│   │   └── slack/events/ # Slack Events API
│   ├── invoices/         # 請求書画面
│   └── estimates/        # 見積書画面
├── services/             # ビジネスロジック層
├── repositories/         # Firestore アクセス層
├── lib/
│   ├── mcp-tools.ts      # MCP ツール実装（全14ツール）
│   ├── slack-ai-handler.ts # Claude AI 会話型 Slack ハンドラ
│   └── auth.ts           # ロール別認可 (authorize 関数)
└── types/                # 型定義
```

---

## MCP エンドポイント

`POST /api/mcp` — claude.ai カスタムコネクタ用（OAuth 不要）

- 認証: なし（claude.ai がカスタムヘッダー非対応のため）
- 認可: `MCP_SYSTEM_ROLE` 環境変数でロール制御（デフォルト: `admin`）
- ツール数: 14（見積/請求書 CRUD・承認・PDF生成・ダッシュボードなど）

ロール権限表:

| 操作 | user | accountant | admin |
|---|---|---|---|
| 読み取り（一覧・詳細） | ✅ | ✅ | ✅ |
| 作成・更新 | ❌ | ✅ | ✅ |
| 削除 | ❌ | ❌ | ✅ |
| 承認・否認 | ❌ | ❌ | ✅ |
| 送付・キャンセル | ❌ | ✅ | ✅ |

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

## ロール・認可

`src/lib/auth.ts` の `authorize(role, action)` で制御。

ロール階層: `user < accountant < admin`

アクション一覧: `document:read`, `document:create`, `document:update`,
`document:delete`, `document:approve`, `document:send`, `document:cancel`,
`client:create`, `client:update`

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
