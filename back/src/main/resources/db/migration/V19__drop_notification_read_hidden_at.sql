DROP INDEX IF EXISTS idx_notification_read_hidden;

ALTER TABLE notification_read
  DROP COLUMN IF EXISTS hidden_at;
