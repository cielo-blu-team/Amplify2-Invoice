output "cloud_run_url" {
  description = "Cloud Run サービスの URL"
  value       = google_cloud_run_v2_service.app.uri
}

output "artifact_registry_repo" {
  description = "Artifact Registry リポジトリ URI"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}"
}

output "gcs_bucket_name" {
  description = "メイン Cloud Storage バケット名"
  value       = google_storage_bucket.main.name
}

output "gcs_archive_bucket_name" {
  description = "アーカイブ Cloud Storage バケット名"
  value       = google_storage_bucket.archive.name
}

output "firestore_database" {
  description = "Firestore データベース名"
  value       = google_firestore_database.main.name
}

output "service_account_email" {
  description = "Cloud Run サービスアカウントのメール"
  value       = google_service_account.cloud_run.email
}

output "github_actions_sa_email" {
  description = "GitHub Actions サービスアカウントのメール"
  value       = google_service_account.github_actions.email
}

output "workload_identity_provider" {
  description = "GitHub Actions Workload Identity Provider のパス"
  value       = google_iam_workload_identity_pool_provider.github.name
}
