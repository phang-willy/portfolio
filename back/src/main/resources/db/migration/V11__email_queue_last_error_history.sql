ALTER TABLE email_queue
  ALTER COLUMN last_error TYPE JSONB
  USING CASE
    WHEN last_error IS NULL OR btrim(last_error) = '' THEN NULL
    WHEN left(btrim(last_error), 1) = '[' THEN last_error::jsonb
    ELSE jsonb_build_array(
      jsonb_build_object(
        'at', to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'message', last_error
      )
    )
  END;
