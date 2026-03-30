# ============================================================
# Cloud Scheduler（EventBridge 相当）
# JST タイムゾーンで定義
# ============================================================

# notification-scheduler: 毎朝 9:00 JST
resource "google_cloud_scheduler_job" "notification_scheduler" {
  project     = var.project_id
  region      = var.region
  name        = "notification-scheduler"
  description = "支払期限アラート（7日前/3日前/当日）"
  schedule    = "0 9 * * *"
  time_zone   = "Asia/Tokyo"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.notification_scheduler.service_config[0].uri

    oidc_token {
      service_account_email = google_service_account.cloud_functions.email
    }
  }

  depends_on = [google_project_service.services]
}

# payment-batch: 毎日 10:00 JST
resource "google_cloud_scheduler_job" "payment_batch" {
  project     = var.project_id
  region      = var.region
  name        = "payment-batch"
  description = "MoneyForward 入金照合バッチ"
  schedule    = "0 10 * * *"
  time_zone   = "Asia/Tokyo"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.payment_batch.service_config[0].uri

    oidc_token {
      service_account_email = google_service_account.cloud_functions.email
    }
  }

  depends_on = [google_project_service.services]
}

# overdue-checker: 毎日 8:00 JST
resource "google_cloud_scheduler_job" "overdue_checker" {
  project     = var.project_id
  region      = var.region
  name        = "overdue-checker"
  description = "滞納チェック・ステータス更新"
  schedule    = "0 8 * * *"
  time_zone   = "Asia/Tokyo"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.overdue_checker.service_config[0].uri

    oidc_token {
      service_account_email = google_service_account.cloud_functions.email
    }
  }

  depends_on = [google_project_service.services]
}
