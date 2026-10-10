ALTER TABLE notification_read
  ADD COLUMN hidden_at TIMESTAMPTZ;

CREATE INDEX idx_notification_read_hidden
  ON notification_read (user_id, notification_id)
  WHERE hidden_at IS NOT NULL;
