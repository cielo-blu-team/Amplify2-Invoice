# ============================================================
# Artifact Registry（Docker イメージ保管）
# ============================================================
resource "google_artifact_registry_repository" "app" {
  project       = var.project_id
  location      = var.region
  repository_id = "invoice"
  description   = "Invoice アプリケーション Docker イメージ"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-last-10"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [google_project_service.services]
}
