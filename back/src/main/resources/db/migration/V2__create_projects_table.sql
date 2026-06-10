CREATE TABLE project (
  id UUID PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(160),
  content TEXT,
  production_link VARCHAR(500),
  source_code_link VARCHAR(500),
  image_link VARCHAR(500),
  image_alt VARCHAR(255),
  lang VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_project_created_at ON project (created_at DESC);
CREATE INDEX idx_project_deleted_at ON project (deleted_at);
CREATE INDEX idx_project_deactivated_at ON project (deactivated_at);
