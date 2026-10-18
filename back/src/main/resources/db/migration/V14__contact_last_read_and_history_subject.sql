ALTER TABLE contact
  ADD COLUMN last_read_at TIMESTAMPTZ;

ALTER TABLE contact_history
  ALTER COLUMN subject TYPE TEXT;
