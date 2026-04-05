#!/bin/bash
#
# 日次バッチジョブの Cloud Scheduler 設定
#
# 毎朝9時（JST）に /api/batch/daily を POST で呼び出す
# - MF仕訳の自動取り込み + AI分類
# - 支払催促通知チェック + Slack送信
#
# 実行前に以下を確認:
# 1. Cloud Run サービス courage-invoice がデプロイ済み
# 2. Cloud Scheduler API が有効化されている
# 3. サービスアカウントに invoker 権限がある

set -euo pipefail

PROJECT_ID="courage-invoice-prod"
REGION="asia-northeast1"
SERVICE_NAME="courage-invoice"
JOB_NAME="daily-batch-mf-sync-reminders"
SCHEDULE="0 9 * * *"  # 毎日 09:00 JST
TIMEZONE="Asia/Tokyo"

SERVICE_URL="https://${SERVICE_NAME}-649548596161.${REGION}.run.app"
BATCH_URL="${SERVICE_URL}/api/batch/daily"

# Cloud Scheduler で使用するサービスアカウント
SA_NAME="scheduler-invoker"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== 日次バッチ Cloud Scheduler セットアップ ==="
echo "  Project:  ${PROJECT_ID}"
echo "  Schedule: ${SCHEDULE} (${TIMEZONE})"
echo "  Target:   ${BATCH_URL}"
echo ""

# 1. サービスアカウント作成（存在しない場合）
echo "[1/3] サービスアカウントを確認..."
if ! CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "  → サービスアカウントを作成します"
  CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 gcloud iam service-accounts create "${SA_NAME}" \
    --project="${PROJECT_ID}" \
    --display-name="Cloud Scheduler Invoker"
else
  echo "  → 既に存在します"
fi

# 2. Cloud Run invoker 権限を付与
echo "[2/3] Cloud Run invoker 権限を付与..."
CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker" \
  --quiet

# 3. Cloud Scheduler ジョブを作成（既存なら更新）
echo "[3/3] Cloud Scheduler ジョブを設定..."
if CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 gcloud scheduler jobs describe "${JOB_NAME}" --project="${PROJECT_ID}" --location="${REGION}" &>/dev/null; then
  echo "  → 既存ジョブを更新します"
  CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 gcloud scheduler jobs update http "${JOB_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --schedule="${SCHEDULE}" \
    --time-zone="${TIMEZONE}" \
    --uri="${BATCH_URL}" \
    --http-method=POST \
    --oidc-service-account-email="${SA_EMAIL}" \
    --oidc-token-audience="${SERVICE_URL}" \
    --attempt-deadline="300s" \
    --quiet
else
  echo "  → 新規ジョブを作成します"
  CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 gcloud scheduler jobs create http "${JOB_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --schedule="${SCHEDULE}" \
    --time-zone="${TIMEZONE}" \
    --uri="${BATCH_URL}" \
    --http-method=POST \
    --oidc-service-account-email="${SA_EMAIL}" \
    --oidc-token-audience="${SERVICE_URL}" \
    --attempt-deadline="300s" \
    --quiet
fi

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "手動実行でテスト:"
echo "  CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 gcloud scheduler jobs run ${JOB_NAME} --project=${PROJECT_ID} --location=${REGION}"
echo ""
echo "ログ確認:"
echo "  CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 gcloud logging read 'resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"courage-invoice\" AND textPayload:\"Batch Daily\"' --project=${PROJECT_ID} --limit=10"
