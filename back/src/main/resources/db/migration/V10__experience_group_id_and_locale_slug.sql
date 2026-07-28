-- Bring experience to: group_id pairing, per-locale slug, no shared code column.
DO $$
BEGIN
  -- Legacy path: shared pairing via `code`, locale slug already ends with -lang.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'experience'
      AND column_name = 'code'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'experience'
      AND column_name = 'group_id'
  ) THEN
    ALTER TABLE experience
      ADD COLUMN group_id UUID;

    WITH pairs AS (
      SELECT code, gen_random_uuid() AS gid
      FROM experience
      GROUP BY code
    )
    UPDATE experience e
    SET group_id = pairs.gid
    FROM pairs
    WHERE e.code = pairs.code;

    UPDATE experience
    SET group_id = gen_random_uuid()
    WHERE group_id IS NULL;

    ALTER TABLE experience
      ALTER COLUMN group_id SET NOT NULL;

    DROP INDEX IF EXISTS uq_experience_code_lang_active;

    ALTER TABLE experience
      DROP COLUMN code;
  END IF;

  -- Alternate legacy path: shared slug pairing, no code, no group_id.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'experience'
      AND column_name = 'group_id'
  ) THEN
    ALTER TABLE experience
      ADD COLUMN group_id UUID;

    WITH pairs AS (
      SELECT slug, gen_random_uuid() AS gid
      FROM experience
      GROUP BY slug
    )
    UPDATE experience e
    SET group_id = pairs.gid
    FROM pairs
    WHERE e.slug = pairs.slug;

    UPDATE experience
    SET group_id = gen_random_uuid()
    WHERE group_id IS NULL;

    ALTER TABLE experience
      ALTER COLUMN group_id SET NOT NULL;

    UPDATE experience
    SET slug = slug || '-' || lang
    WHERE slug NOT LIKE '%-' || lang;

    DROP INDEX IF EXISTS uq_experience_slug_lang_active;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uq_experience_slug_active'
  ) THEN
    CREATE UNIQUE INDEX uq_experience_slug_active
      ON experience (slug)
      WHERE deleted_at IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_experience_group_id'
  ) THEN
    CREATE INDEX idx_experience_group_id
      ON experience (group_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uq_experience_group_lang_active'
  ) THEN
    CREATE UNIQUE INDEX uq_experience_group_lang_active
      ON experience (group_id, lang)
      WHERE deleted_at IS NULL;
  END IF;
END $$;
