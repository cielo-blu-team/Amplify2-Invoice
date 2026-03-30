# ============================================================
# Firestore データベース（Native mode）
# ============================================================
resource "google_firestore_database" "main" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # ポイントインタイムリカバリ（DynamoDB の pointInTimeRecovery 相当）
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED"

  delete_protection_state = "DELETE_PROTECTION_ENABLED"

  depends_on = [google_project_service.services]
}

# ============================================================
# Firestore 複合インデックス（DynamoDB GSI 相当）
# ============================================================

# documents コレクション

# GSI-ClientId 相当: clientId + issueDate
resource "google_firestore_index" "documents_client_issue" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "documents"

  fields {
    field_path = "clientId"
    order      = "ASCENDING"
  }
  fields {
    field_path = "issueDate"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# isDeleted + clientId + issueDate（一覧取得の基本フィルタ + clientId）
resource "google_firestore_index" "documents_deleted_client_issue" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "documents"

  fields {
    field_path = "isDeleted"
    order      = "ASCENDING"
  }
  fields {
    field_path = "clientId"
    order      = "ASCENDING"
  }
  fields {
    field_path = "issueDate"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# GSI-Status 相当: status + issueDate
resource "google_firestore_index" "documents_status_issue" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "documents"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "issueDate"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# isDeleted + status + issueDate
resource "google_firestore_index" "documents_deleted_status_issue" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "documents"

  fields {
    field_path = "isDeleted"
    order      = "ASCENDING"
  }
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "issueDate"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# GSI-CreatedBy 相当: createdBy + createdAt
resource "google_firestore_index" "documents_createdby_createdat" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "documents"

  fields {
    field_path = "createdBy"
    order      = "ASCENDING"
  }
  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# GSI-DocumentType 相当: documentType + issueDate
resource "google_firestore_index" "documents_type_issue" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "documents"

  fields {
    field_path = "documentType"
    order      = "ASCENDING"
  }
  fields {
    field_path = "issueDate"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# isDeleted + issueDate（一覧取得の基本フィルタ）
resource "google_firestore_index" "documents_deleted_issue" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "documents"

  fields {
    field_path = "isDeleted"
    order      = "ASCENDING"
  }
  fields {
    field_path = "issueDate"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# 期限チェック用: status + isDeleted + dueDate
resource "google_firestore_index" "documents_status_deleted_due" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "documents"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "isDeleted"
    order      = "ASCENDING"
  }
  fields {
    field_path = "dueDate"
    order      = "ASCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

# clients コレクション

# GSI-ClientName 相当: isDeleted + clientNameKana
resource "google_firestore_index" "clients_deleted_kana" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "clients"

  fields {
    field_path = "isDeleted"
    order      = "ASCENDING"
  }
  fields {
    field_path = "clientNameKana"
    order      = "ASCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

# auditLogs コレクション

# date + timestamp DESC
resource "google_firestore_index" "audit_date_ts" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "auditLogs"

  fields {
    field_path = "date"
    order      = "ASCENDING"
  }
  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# userId + timestamp DESC
resource "google_firestore_index" "audit_user_ts" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "auditLogs"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }
  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# resourceId + timestamp DESC
resource "google_firestore_index" "audit_resource_ts" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "auditLogs"

  fields {
    field_path = "resourceId"
    order      = "ASCENDING"
  }
  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# ============================================================
# Firestore TTL ポリシー
# DynamoDB の timeToLiveAttribute 相当
# ============================================================

# auditLogs: expiresAt フィールドで TTL（7年）
resource "google_firestore_field" "audit_ttl" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "auditLogs"
  field      = "expiresAt"

  ttl_config {}
}

# idempotencyKeys: expiresAt フィールドで TTL（24時間）
resource "google_firestore_field" "idempotency_ttl" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "idempotencyKeys"
  field      = "expiresAt"

  ttl_config {}
}
