CREATE TABLE IF NOT EXISTS app_state_backups (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL,
  state_updated_at TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  cause_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_app_state_backups_created_at
  ON app_state_backups (created_at DESC);
