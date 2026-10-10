ALTER TABLE project DROP CONSTRAINT IF EXISTS project_slug_key;

CREATE UNIQUE INDEX uq_project_slug_lang_active
  ON project (slug, lang)
  WHERE deleted_at IS NULL;
