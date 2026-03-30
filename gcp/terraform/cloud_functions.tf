# ============================================================
# Cloud Storage バケット（Cloud Functions ソースコード用）
# ============================================================
resource "google_storage_bucket" "functions_source" {
  name                        = "${var.project_id}-functions-source"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true

  depends_on = [google_project_service.services]
}

# ============================================================
# Cloud Functions v2（Lambda 相当）
# ============================================================

# 1. notification-scheduler（毎朝9:00 — 支払期限アラート）
resource "google_storage_bucket_object" "notification_scheduler_source" {
  name   = "notification-scheduler-${filemd5("${path.module}/../../gcp/functions/notification-scheduler/index.ts")}.zip"
  bucket = google_storage_bucket.functions_source.name
  source = data.archive_file.notification_scheduler.output_path
}

data "archive_file" "notification_scheduler" {
  type        = "zip"
  source_dir  = "${path.module}/../../gcp/functions/notification-scheduler"
  output_path = "/tmp/notification-scheduler.zip"
}

resource "google_cloudfunctions2_function" "notification_scheduler" {
  project  = var.project_id
  name     = "notification-scheduler"
  location = var.region

  build_config {
    runtime     = "nodejs22"
    entry_point = "handler"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.notification_scheduler_source.name
      }
    }
  }

  service_config {
    max_instance_count    = 1
    min_instance_count    = 0
    available_memory      = "512M"
    timeout_seconds       = 300
    service_account_email = google_service_account.cloud_functions.email

    environment_variables = {
      GCP_PROJECT_ID       = var.project_id
      FIRESTORE_DATABASE   = google_firestore_database.main.name
    }

    secret_environment_variables {
      key        = "SLACK_WEBHOOK_URL"
      project_id = var.project_id
      secret     = var.slack_webhook_url_secret
      version    = "latest"
    }
  }

  depends_on = [google_project_service.services]
}

# 2. payment-batch（毎日10:00 — MoneyForward入金照合）
resource "google_storage_bucket_object" "payment_batch_source" {
  name   = "payment-batch-${filemd5("${path.module}/../../gcp/functions/payment-batch/index.ts")}.zip"
  bucket = google_storage_bucket.functions_source.name
  source = data.archive_file.payment_batch.output_path
}

data "archive_file" "payment_batch" {
  type        = "zip"
  source_dir  = "${path.module}/../../gcp/functions/payment-batch"
  output_path = "/tmp/payment-batch.zip"
}

resource "google_cloudfunctions2_function" "payment_batch" {
  project  = var.project_id
  name     = "payment-batch"
  location = var.region

  build_config {
    runtime     = "nodejs22"
    entry_point = "handler"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.payment_batch_source.name
      }
    }
  }

  service_config {
    max_instance_count    = 1
    min_instance_count    = 0
    available_memory      = "512M"
    timeout_seconds       = 540
    service_account_email = google_service_account.cloud_functions.email

    environment_variables = {
      GCP_PROJECT_ID     = var.project_id
      FIRESTORE_DATABASE = google_firestore_database.main.name
    }

    secret_environment_variables {
      key        = "MONEYFORWARD_API_KEY"
      project_id = var.project_id
      secret     = var.moneyforward_api_key_secret
      version    = "latest"
    }

    secret_environment_variables {
      key        = "SLACK_WEBHOOK_URL"
      project_id = var.project_id
      secret     = var.slack_webhook_url_secret
      version    = "latest"
    }
  }

  depends_on = [google_project_service.services]
}

# 3. overdue-checker（毎日8:00 — 滞納チェック）
resource "google_storage_bucket_object" "overdue_checker_source" {
  name   = "overdue-checker-${filemd5("${path.module}/../../gcp/functions/overdue-checker/index.ts")}.zip"
  bucket = google_storage_bucket.functions_source.name
  source = data.archive_file.overdue_checker.output_path
}

data "archive_file" "overdue_checker" {
  type        = "zip"
  source_dir  = "${path.module}/../../gcp/functions/overdue-checker"
  output_path = "/tmp/overdue-checker.zip"
}

resource "google_cloudfunctions2_function" "overdue_checker" {
  project  = var.project_id
  name     = "overdue-checker"
  location = var.region

  build_config {
    runtime     = "nodejs22"
    entry_point = "handler"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.overdue_checker_source.name
      }
    }
  }

  service_config {
    max_instance_count    = 1
    min_instance_count    = 0
    available_memory      = "512M"
    timeout_seconds       = 300
    service_account_email = google_service_account.cloud_functions.email

    environment_variables = {
      GCP_PROJECT_ID     = var.project_id
      FIRESTORE_DATABASE = google_firestore_database.main.name
    }

    secret_environment_variables {
      key        = "SLACK_WEBHOOK_URL"
      project_id = var.project_id
      secret     = var.slack_webhook_url_secret
      version    = "latest"
    }
  }

  depends_on = [google_project_service.services]
}
