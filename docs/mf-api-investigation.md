# マネーフォワード クラウド API 調査結果

調査日: 2026-04-05
ソース: https://developers.biz.moneyforward.com/docs/

---

## 1. API認証方式

MFクラウドのAPIは2つの認証方式を提供:

| 方式 | 用途 | トークン有効期限 |
|---|---|---|
| **OAuth 2.0** | ユーザー同意に基づくアクセス（事業者全体のデータ） | アクセストークン: 1時間, リフレッシュトークン: 540日 |
| **APIキー** | サーバー間通信・自動化（ユーザー権限で実行） | APIキー自体: 無期限, JWT: 1時間 |

### OAuth 2.0 フロー
```
1. アプリ登録（アプリポータル） → Client ID / Client Secret 取得
2. 認可コード取得 → GET https://api.biz.moneyforward.com/authorize
3. アクセストークン取得 → POST https://api.biz.moneyforward.com/token
4. API呼び出し → GET https://api.biz.moneyforward.com/{service}/api/v1/...
                   Authorization: Bearer {access_token}
5. トークン更新 → POST https://api.biz.moneyforward.com/token (refresh_token)
```

### APIキー フロー
```
1. APIキー発行（アプリポータル） → mf_api_prd_xxx 取得
2. JWT取得 → POST https://api.biz.moneyforward.com/auth/exchange
              Authorization: Bearer {api_key}
3. API呼び出し → GET https://api.biz.moneyforward.com/{service}/api/v1/...
                   Authorization: Bearer {jwt}
4. JWT更新 → 期限切れ後、再度 /auth/exchange
```

---

## 2. 前提条件

> **マネーフォワード クラウドで事業者を作成済みであること（事業者区分や契約プランは問いません）**

- アプリポータルの登録および利用は**無料**
- 管理コンソールの「全権管理者」権限が初回利用開始時に必要
- ソース: [アプリポータルの概要（OAuth）セクション6](https://developers.biz.moneyforward.com/docs/common/oauth/app-portal-overview)

---

## 3. スコープ体系

```
mfc/{サービス名}/{リソース}.{権限}
```

### 確認済みスコープ例

| スコープ | 対象サービス |
|---|---|
| `mfc/admin/tenant.read` | 事業者情報（認可サーバーAPI） |
| `mfc/invoice/data.read` | クラウド請求書 |
| `mfc/invoice/data.write` | クラウド請求書 |
| `mfc/enterprise-accounting/journal.read` | 会計Plus（仕訳読み取り） |
| `mfc/enterprise-accounting/journal.write` | 会計Plus（仕訳書き込み） |
| `mfc/enterprise-accounting/master.read` | 会計Plus（マスタ読み取り） |
| `mfc/enterprise-accounting/office.read` | 会計Plus（事業者情報読み取り） |
| `mfc/enterprise-accounting/report.read` | 会計Plus（帳票読み取り） |
| `mfc/biz-admin/tenant.service.read` | 管理コンソール（利用中サービス） |

---

## 4. パートナーAPI サービス一覧

開発者サイトで公開されている全16サービス:

| サービス名 | 製品名 | ベースURL |
|---|---|---|
| `attendance` | クラウド勤怠 | — |
| `biz-admin` | 管理コンソール | `api.biz-admin.moneyforward.com/v1` |
| `box` | クラウドBox | — |
| `consolidated-accounting` | 連結会計 | — |
| `contract` | クラウド契約 | — |
| `employee` | 従業員と組織 | — |
| `enterprise-accounting` | **会計Plus** | `api-enterprise-accounting.moneyforward.com/api/v3` (v3), `/api/v4` (v4) |
| `expense` | クラウド経費 | — |
| `fixed-assets` | クラウド固定資産 | — |
| `hris` | クラウド人事管理 | — |
| `payroll` | クラウド給与 | — |
| `project-cost` | クラウド個別原価 | — |
| `receivable` | 請求書Plus | — |
| `send-invoice` | インボイス送付プラン | — |
| `social-insurance` | クラウド社会保険 | — |
| `tax-adjustment` | クラウド年末調整 | — |

### 注記
- 通常の「クラウド会計」のパートナーAPIは**開発者サイトには未掲載**
- ただし前提条件に「契約プランは問いません」とあり、会計APIが別の形で提供されている可能性がある

---

## 5. 認可サーバーAPI（全プラン共通）

ベースURL: `https://api.biz.moneyforward.com`

| エンドポイント | メソッド | 説明 | スコープ |
|---|---|---|---|
| `/authorize` | GET | 認可エンドポイント | — |
| `/token` | POST | トークン取得/更新 | — |
| `/token/revoke` | POST | トークン取り消し | — |
| `/auth/exchange` | POST | APIキー → JWT交換 | — |
| `/v2/tenant` | GET | 事業者情報の取得 | `mfc/admin/tenant.read` |

---

## 6. 会計Plus API エンドポイント詳細

ベースURL: `https://api-enterprise-accounting.moneyforward.com`

### v3 API

| カテゴリ | エンドポイント | メソッド | 説明 |
|---|---|---|---|
| **仕訳** | `/api/v3/journals` | GET | 仕訳一覧取得 |
| | `/api/v3/journals` | POST | 仕訳作成 |
| | `/api/v3/journals/:id` | GET | 仕訳参照 |
| | `/api/v3/journals/:id` | DELETE | 仕訳削除 |
| | `/api/v3/journals/:id/reverse` | POST | 逆仕訳作成 |
| | `/api/v3/journals/:id/voucher_file` | GET | 証憑ファイル取得 |
| **マスタ** | `/api/v3/masters/accounts` | GET | 勘定科目マスタ一覧 |
| | `/api/v3/masters/sub_accounts` | GET | 補助科目マスタ一覧 |
| | `/api/v3/masters/taxes` | GET | 税区分マスタ一覧 |
| | `/api/v3/masters/departments` | GET | 部門マスタ一覧 |
| | `/api/v3/masters/projects` | GET | プロジェクト一覧 |
| | `/api/v3/masters/counterparties` | GET/POST/PATCH/DELETE | 取引先マスタ |
| **事業者** | `/api/v3/offices/accounting_periods` | GET | 会計期間取得 |
| **帳票** | `/api/v3/reports/trial_balance/bs` | GET | 残高試算表（貸借対照表） |
| | `/api/v3/reports/trial_balance/pl` | GET | 残高試算表（損益計算書） |
| | `/api/v3/reports/department_table/bs` | GET | 部門別集計表（BS） |
| | `/api/v3/reports/department_table/pl` | GET | 部門別集計表（PL） |

### v4 API（追加エンドポイント）

| カテゴリ | エンドポイント | メソッド | 説明 |
|---|---|---|---|
| 仕訳 | `/api/v4/journals/:id/voucher_files` | POST | 仕訳に証憑ファイル追加 |
| 仕訳 | `/api/v4/journals/:id/voucher_files` | DELETE | 仕訳から証憑ファイル解除 |
| 仕訳 | `/api/v4/journals/:id/voucher_urls` | DELETE | 仕訳からURL証憑解除 |
| 仕訳 | `/api/v4/journals/:id/voucher_urls` | POST | 仕訳にURL証憑追加 |
| マスタ | `/api/v4/masters/accounts` | GET/POST/PATCH/DELETE | 勘定科目マスタCRUD |
| マスタ | `/api/v4/masters/account_groups` | GET/POST/PATCH/DELETE | 決算書科目マスタCRUD |
| マスタ | `/api/v4/masters/sub_accounts` | GET/POST/PATCH/DELETE | 補助科目マスタCRUD |
| マスタ | `/api/v4/masters/departments` | CRUD | 部門マスタCRUD |
| マスタ | `/api/v4/masters/projects` | CRUD | プロジェクトマスタCRUD |
| マスタ | `/api/v4/masters/taxes` | GET/PATCH | 税区分マスタ |
| ユーザー | `/api/v4/members` | GET | メンバー一覧 |
| 帳票 | `/api/v4/reports/counterparty` | GET | 取引先別集計表 |
| 帳票 | `/api/v4/reports/monthly_transition` | GET | 月次推移表 |
| 帳票 | `/api/v4/reports/project_table` | GET | プロジェクト別集計表 |

---

## 7. 管理コンソールAPI（利用中サービス確認用）

ベースURL: `https://api.biz-admin.moneyforward.com/v1`

| エンドポイント | メソッド | スコープ | 説明 |
|---|---|---|---|
| `/tenant/active_services` | GET | `mfc/biz-admin/tenant.service.read` | 事業者の利用中サービス一覧 |
| `/tenant/users/:id/active_services` | GET | `mfc/biz-admin/tenant.service.read` | ユーザーの利用中サービス一覧 |
| `/tenant/users` | GET | `mfc/biz-admin/tenant.user.read` | テナントユーザー一覧 |

---

## 8. セキュリティ要件

- Client Secret は環境変数またはシークレット管理サービスで管理
- APIキー・JWT・アクセストークンはログに出力しない
- 通信は必ず HTTPS
- トークン漏洩時は即座に無効化
- APIキーは定期ローテーション推奨

---

## 9. クラウド会計 MCPサーバー（通常会計対応 — 推奨）

ソース: https://biz.moneyforward.com/support/account/guide/others/ot10.html

### 概要

MFは通常の「クラウド会計・確定申告」向けに**MCPサーバー**を公式提供している。
パートナーAPI（REST）では会計Plus契約が必要だが、**MCPサーバー経由であれば通常のクラウド会計でも仕訳操作が可能**。追加料金なし。

### 対象
- マネーフォワード クラウド会計・確定申告をご利用中のユーザー
- 会計Plusの契約は**不要**

### MCPサーバーURL

| URL | 提供開始 | 備考 |
|---|---|---|
| `https://alpha.mcp.developers.biz.moneyforward.com/mcp/ca/v3` | 2026-03-26 | 1時間ごとに再認証が必要 |
| `https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3` | 2026-04-01 | 認証時間延長 + 再認証自動化（**推奨**） |

> **注意**: Gemini CLI は beta URL を利用できない（認証方式の差異）。alpha を使用すること。

### MCP設定ファイル例
```json
{
  "mcpServers": {
    "mfc_ca": {
      "url": "https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3"
    }
  }
}
```

### 利用可能な操作（MCPツール）

| カテゴリ | 操作 |
|---|---|
| **事業者** | 事業者情報の取得 |
| **仕訳** | 仕訳一覧の取得、仕訳の取得、仕訳の新規作成、仕訳の更新 |
| **帳票** | 残高試算表の取得、推移表の取得 |
| **マスタ** | 勘定科目の取得、補助科目の取得、取引先の取得、部門の取得、税区分の取得 |
| **明細** | 入出金明細の作成 |

### 事前準備

1. **アプリポータルの利用開始**（管理コンソールの「全権管理」権限が必要）
   - https://app-portal.moneyforward.com/ にログイン
   - 事業者を選択

2. **ユーザーへの権限付与**（アプリポータル → ユーザー → 編集）
   - 「アプリ連携」にチェック
   - 「クラウド会計・確定申告」にチェック

### 注意事項
- 認可コードがAIツールの学習に使用されないよう、データ収集を許可しない設定で利用する
- 複数事業者を扱う場合は操作開始時に事業者情報を確認する
- 事業者を切り替える場合はチャットセッションを終了してから再設定する
- 登録可能な仕訳件数等は有償プランの制限と同様

### API方式との比較

| 項目 | REST API（会計Plus） | MCPサーバー（通常会計） |
|---|---|---|
| 対象プラン | 会計Plus のみ | クラウド会計・確定申告（全プラン） |
| 追加料金 | なし（Plus契約は必要） | なし |
| 認証 | OAuth 2.0 / APIキー | MCP OAuth（自動） |
| 仕訳 CRUD | o (v3/v4) | o（取得・作成・更新） |
| 仕訳削除 | o | x（未提供） |
| 証憑ファイル | o (v4) | x |
| 帳票 | 試算表BS/PL, 部門別, 取引先別, 月次推移, プロジェクト | 残高試算表, 推移表 |
| マスタ CRUD | o（取引先は作成・更新・削除も可） | 取得のみ |
| 入出金明細 | x | o（作成） |
| 接続方式 | HTTP REST | MCP (Streamable HTTP) |
| プログラムから利用 | 容易（fetch / axios 等） | MCP Client SDK が必要 |

---

## 10. 現在の課題と次のアクション

### 現状
- OAuth認証フローは正常動作（トークン取得成功）
- `enterprise-accounting` REST API → `403 has_no_contract`（会計Plus未契約）
- 通常のクラウド会計用パートナー REST API は開発者サイトに未掲載
- **MCPサーバー経由であれば通常のクラウド会計でも仕訳操作が可能**（セクション9参照）

### 推奨アプローチ: MCPサーバー連携

会計Plus未契約の場合、**MCPサーバー経由での連携が最も現実的**。

1. **Courage Invoice サーバーから MCP Client として接続**
   - MCP Client SDK (`@modelcontextprotocol/sdk`) を使用
   - beta URL: `https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3`
   - OAuth認証はMCPプロトコルが自動処理

2. **アプリポータルの権限設定**
   - 「アプリ連携」+「クラウド会計・確定申告」をユーザーに付与
   - URL: https://app-portal.moneyforward.com/

3. **実装する機能**
   - 仕訳一覧取得・仕訳作成（請求書の会計連携）
   - 勘定科目・取引先マスタ取得（帳票作成時のマッピング）
   - 残高試算表取得（ダッシュボード連携）

### 代替アプローチ: REST API（会計Plus契約後）

将来的に会計Plus契約を追加した場合は、既存のOAuthコードがそのまま動作する。
- `src/lib/mf-oauth-client.ts` のスコープ・エンドポイント設定は会計Plus用に準備済み
- `enterprise-accounting` API でプログラム的なアクセスが可能
