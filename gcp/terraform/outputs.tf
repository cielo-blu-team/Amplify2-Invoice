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
