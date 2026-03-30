# ============================================================
# サービスアカウント定義
# ============================================================

# Cloud Run 用サービスアカウント
resource "google_service_account" "cloud_run" {
  account_id   = "invoice-cloud-run"
  display_name = "Invoice App - Cloud Run"
  project      = var.project_id
}

# Cloud Functions 用サービスアカウント
resource "google_service_account" "cloud_functions" {
  account_id   = "invoice-cloud-functions"
  display_name = "Invoice App - Cloud Functions"
  project      = var.project_id
}

# GitHub Actions CD 用サービスアカウント
resource "google_service_account" "github_actions" {
  account_id   = "invoice-github-actions"
  display_name = "Invoice App - GitHub Actions CD"
  project      = var.project_id
}

# ============================================================
# IAM ロール付与
# ============================================================

# Cloud Run → Firestore
resource "google_project_iam_member" "cloud_run_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run → Secret Manager（環境変数取得）
resource "google_project_iam_member" "cloud_run_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run → Cloud Logging
resource "google_project_iam_member" "cloud_run_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run → Cloud Monitoring
resource "google_project_iam_member" "cloud_run_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run → Firebase Auth（ユーザー管理）
resource "google_project_iam_member" "cloud_run_firebase_auth" {
  project = var.project_id
  role    = "roles/firebaseauth.admin"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Functions → Firestore
resource "google_project_iam_member" "cloud_functions_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_functions.email}"
}

# Cloud Functions → Secret Manager
resource "google_project_iam_member" "cloud_functions_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_functions.email}"
}

# Cloud Functions → Cloud Logging
resource "google_project_iam_member" "cloud_functions_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_functions.email}"
}

# GitHub Actions → Cloud Run デプロイ
resource "google_project_iam_member" "github_actions_run_deploy" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# GitHub Actions → Artifact Registry（Docker push）
resource "google_project_iam_member" "github_actions_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# GitHub Actions → サービスアカウントの権限借用
resource "google_service_account_iam_member" "github_actions_sa_user" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}

# GitHub Actions の Workload Identity Federation（キーレス認証）
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
  project                   = var.project_id
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Provider"
  project                            = var.project_id

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = "assertion.repository == 'cielo-blu-team/Amplify2-Invoice'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# GitHub Actions Workload Identity → invoice-github-actions SA への権限借用
resource "google_service_account_iam_member" "workload_identity_user" {
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/cielo-blu-team/Amplify2-Invoice"
}
