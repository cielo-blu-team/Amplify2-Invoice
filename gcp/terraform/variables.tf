variable "project_id" {
  description = "GCP プロジェクト ID"
  type        = string
}

variable "region" {
  description = "GCP リージョン（デフォルト: 東京）"
  type        = string
  default     = "asia-northeast1"
}

variable "environment" {
  description = "デプロイ環境（dev / staging / prod）"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "アプリケーション名"
  type        = string
  default     = "amplify2-invoice"
}

variable "cloud_run_image" {
  description = "Cloud Run で使用する Docker イメージ（フル URI）"
  type        = string
  # 例: asia-northeast1-docker.pkg.dev/<project>/invoice/app:latest
}

variable "cloud_run_min_instances" {
  description = "Cloud Run 最小インスタンス数（コールドスタート対策）"
  type        = number
  default     = 1
}

variable "cloud_run_max_instances" {
  description = "Cloud Run 最大インスタンス数"
  type        = number
  default     = 10
}

variable "slack_webhook_url_secret" {
  description = "Slack Webhook URL を格納した Secret Manager シークレット名"
  type        = string
  default     = "slack-webhook-url"
}

variable "moneyforward_api_key_secret" {
  description = "MoneyForward API キーを格納した Secret Manager シークレット名"
  type        = string
  default     = "moneyforward-api-key"
}
