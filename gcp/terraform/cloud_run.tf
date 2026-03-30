# ============================================================
# Cloud Run サービス（Next.js アプリ本体）
# ============================================================
resource "google_cloud_run_v2_service" "app" {
  project  = var.project_id
  name     = var.app_name
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.cloud_run_min_instances
      max_instance_count = var.cloud_run_max_instances
    }

    containers {
      image = var.cloud_run_image

      resources {
        limits = {
          # puppeteer (Chromium) の実行に 4GB 必要
          memory = "4Gi"
          cpu    = "2"
        }
        cpu_idle = true
        startup_cpu_boost = true
      }

      ports {
        container_port = 3000
      }

      # 環境変数（Secret Manager から注入）
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.main.name
      }

      env {
        name  = "GCS_ARCHIVE_BUCKET_NAME"
        value = google_storage_bucket.archive.name
      }

      env {
        name = "SLACK_WEBHOOK_URL"
        value_source {
          secret_key_ref {
            secret  = var.slack_webhook_url_secret
            version = "latest"
          }
        }
      }

      env {
        name = "MONEYFORWARD_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.moneyforward_api_key_secret
            version = "latest"
          }
        }
      }

      # ヘルスチェック
      startup_probe {
        http_get {
          path = "/api/health"
          port = 3000
        }
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 5
      }

      liveness_probe {
        http_get {
          path = "/api/health"
          port = 3000
        }
        initial_delay_seconds = 0
        timeout_seconds       = 5
        period_seconds        = 30
        failure_threshold     = 3
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.services,
    google_service_account.cloud_run,
  ]
}

# パブリックアクセスを許可（認証はアプリ側で実施）
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
