# ============================================================
# Cloud Storage バケット
# ============================================================

# メインバケット（ドキュメント PDF + 画像）
resource "google_storage_bucket" "main" {
  name                        = "${var.project_id}-invoice-main"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  # 電子帳簿保存法対応: 7年間の保持ポリシー（S3 Object Lock 相当）
  retention_policy {
    retention_period = 220752000 # 7年 = 7 × 365 × 24 × 3600 秒
    is_locked        = false     # 本番運用時に true に設定してロック
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "PUT", "POST"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.services]
}

# アーカイブバケット（Glacier 相当: 長期保存）
resource "google_storage_bucket" "archive" {
  name                        = "${var.project_id}-invoice-archive"
  location                    = var.region
  storage_class               = "COLDLINE"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  # 電帳法対応: 7年保持
  retention_policy {
    retention_period = 220752000
    is_locked        = false
  }

  # ライフサイクルルール（S3 Glacier ライフサイクル相当）
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }

  depends_on = [google_project_service.services]
}

# Cloud Run サービスアカウントにバケットへのアクセス権を付与
resource "google_storage_bucket_iam_member" "main_writer" {
  bucket = google_storage_bucket.main.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_storage_bucket_iam_member" "archive_writer" {
  bucket = google_storage_bucket.archive.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Functions サービスアカウントにも付与
resource "google_storage_bucket_iam_member" "main_functions_reader" {
  bucket = google_storage_bucket.main.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.cloud_functions.email}"
}
