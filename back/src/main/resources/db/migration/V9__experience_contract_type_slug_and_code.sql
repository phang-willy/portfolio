DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'experience_contract_type'
      AND column_name = 'slug'
  ) THEN
    ALTER TABLE experience_contract_type
      ADD COLUMN slug VARCHAR(255);

    UPDATE experience_contract_type
    SET slug = code
    WHERE slug IS NULL;

    ALTER TABLE experience_contract_type
      ALTER COLUMN slug SET NOT NULL;

    UPDATE experience_contract_type
    SET code = slug || '-' || lang;

    DROP INDEX IF EXISTS uq_experience_contract_type_code_lang_active;

    CREATE UNIQUE INDEX uq_experience_contract_type_slug_lang_active
      ON experience_contract_type (slug, lang)
      WHERE deleted_at IS NULL;

    CREATE UNIQUE INDEX uq_experience_contract_type_code_active
      ON experience_contract_type (code)
      WHERE deleted_at IS NULL;
  END IF;
END $$;
