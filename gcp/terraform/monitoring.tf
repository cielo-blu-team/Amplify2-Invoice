# ============================================================
# Cloud Monitoring（CloudWatch 相当）
# ============================================================

# ログベースのメトリクス（カスタムメトリクス）
resource "google_logging_metric" "error_rate" {
  project     = var.project_id
  name        = "invoice/error_rate"
  description = "アプリケーションエラー率"
  filter      = "resource.type=\"cloud_run_revision\" severity>=ERROR"

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "severity"
      value_type  = "STRING"
      description = "ログの severity"
    }
  }

  label_extractors = {
    "severity" = "EXTRACT(severity)"
  }
}

resource "google_logging_metric" "pdf_generated" {
  project     = var.project_id
  name        = "invoice/pdf_generated"
  description = "PDF生成件数"
  filter      = "resource.type=\"cloud_run_revision\" jsonPayload.event=\"PDF_GENERATED\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

resource "google_logging_metric" "document_created" {
  project     = var.project_id
  name        = "invoice/document_created"
  description = "帳票作成件数"
  filter      = "resource.type=\"cloud_run_revision\" jsonPayload.event=\"DOCUMENT_CREATED\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

# ============================================================
# アラートポリシー
# 注意: Slack 通知チャンネルは Console から手動設定（auth_token が必要なため）
# ============================================================

resource "google_monitoring_alert_policy" "high_error_rate" {
  project      = var.project_id
  display_name = "高エラー率アラート"
  combiner     = "OR"

  conditions {
    display_name = "エラー率が5件/分超過"

    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/invoice/error_rate\" resource.type=\"cloud_run_revision\""
      duration        = "120s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  alert_strategy {
    auto_close = "604800s"
  }
}

resource "google_monitoring_alert_policy" "pdf_generation_failure" {
  project      = var.project_id
  display_name = "PDF生成失敗アラート"
  combiner     = "OR"

  conditions {
    display_name = "PDF生成エラーが10件/分超過"

    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/invoice/error_rate\" resource.type=\"cloud_run_revision\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  alert_strategy {
    auto_close = "604800s"
  }
}
