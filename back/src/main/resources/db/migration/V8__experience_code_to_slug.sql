DO $$
BEGIN
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
      AND column_name = 'slug'
  ) THEN
    ALTER TABLE experience RENAME COLUMN code TO slug;
    DROP INDEX IF EXISTS uq_experience_code_lang_active;
    CREATE UNIQUE INDEX uq_experience_slug_lang_active
      ON experience (slug, lang)
      WHERE deleted_at IS NULL;
  END IF;
END $$;
