CREATE TABLE IF NOT EXISTS app_metadata (
  id BIGSERIAL PRIMARY KEY,
  metadata_key VARCHAR(120) NOT NULL UNIQUE,
  metadata_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_metadata (metadata_key, metadata_value)
VALUES ('schema_version', '1')
ON CONFLICT (metadata_key) DO NOTHING;
