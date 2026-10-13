ALTER TABLE project
  ADD COLUMN github_created_at TIMESTAMPTZ,
  ADD COLUMN github_updated_at TIMESTAMPTZ;

CREATE INDEX idx_project_github_updated_at ON project (github_updated_at DESC);
