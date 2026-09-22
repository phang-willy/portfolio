ALTER TABLE email_queue
  ADD COLUMN html boolean NOT NULL DEFAULT false;

ALTER TABLE email_queue
  ALTER COLUMN subject TYPE text;
