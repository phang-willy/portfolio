-- Backfill missing locale rows so every active slug has both fr and en.
-- Copy stack links from the source locale row to the backfilled row.

WITH fr_only AS (
  SELECT fr.*
  FROM project fr
  WHERE fr.deleted_at IS NULL
    AND fr.lang = 'fr'
    AND NOT EXISTS (
      SELECT 1
      FROM project other
      WHERE other.slug = fr.slug
        AND other.lang = 'en'
        AND other.deleted_at IS NULL
    )
),
inserted_en AS (
  INSERT INTO project (
    id,
    title,
    slug,
    description,
    content,
    production_link,
    source_code_link,
    image_link,
    image_alt,
    lang,
    created_at,
    updated_at,
    deactivated_at,
    deleted_at
  )
  SELECT
    gen_random_uuid(),
    title,
    slug,
    description,
    content,
    production_link,
    source_code_link,
    image_link,
    image_alt,
    'en',
    created_at,
    updated_at,
    deactivated_at,
    deleted_at
  FROM fr_only
  RETURNING id, slug
)
INSERT INTO project_stacks (id, id_project, id_stack, created_at, updated_at, deleted_at)
SELECT
  gen_random_uuid(),
  inserted_en.id,
  ps.id_stack,
  ps.created_at,
  ps.updated_at,
  ps.deleted_at
FROM inserted_en
JOIN project fr ON fr.slug = inserted_en.slug AND fr.lang = 'fr' AND fr.deleted_at IS NULL
JOIN project_stacks ps ON ps.id_project = fr.id AND ps.deleted_at IS NULL;

WITH en_only AS (
  SELECT en.*
  FROM project en
  WHERE en.deleted_at IS NULL
    AND en.lang = 'en'
    AND NOT EXISTS (
      SELECT 1
      FROM project other
      WHERE other.slug = en.slug
        AND other.lang = 'fr'
        AND other.deleted_at IS NULL
    )
),
inserted_fr AS (
  INSERT INTO project (
    id,
    title,
    slug,
    description,
    content,
    production_link,
    source_code_link,
    image_link,
    image_alt,
    lang,
    created_at,
    updated_at,
    deactivated_at,
    deleted_at
  )
  SELECT
    gen_random_uuid(),
    title,
    slug,
    description,
    content,
    production_link,
    source_code_link,
    image_link,
    image_alt,
    'fr',
    created_at,
    updated_at,
    deactivated_at,
    deleted_at
  FROM en_only
  RETURNING id, slug
)
INSERT INTO project_stacks (id, id_project, id_stack, created_at, updated_at, deleted_at)
SELECT
  gen_random_uuid(),
  inserted_fr.id,
  ps.id_stack,
  ps.created_at,
  ps.updated_at,
  ps.deleted_at
FROM inserted_fr
JOIN project en ON en.slug = inserted_fr.slug AND en.lang = 'en' AND en.deleted_at IS NULL
JOIN project_stacks ps ON ps.id_project = en.id AND ps.deleted_at IS NULL;

UPDATE project
SET image_link = REPLACE(image_link, '/api/admin/projects/images/', '/api/project/image/')
WHERE image_link LIKE '/api/admin/projects/images/%';

UPDATE project
SET image_link = REPLACE(image_link, '/api/admin/project/image/', '/api/project/image/')
WHERE image_link LIKE '/api/admin/project/image/%';
