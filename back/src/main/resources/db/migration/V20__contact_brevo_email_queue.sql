ALTER TABLE email_queue
  ADD COLUMN channel VARCHAR(20) NOT NULL DEFAULT 'SMTP';

ALTER TABLE email_queue
  ADD CONSTRAINT ck_email_queue_channel CHECK (channel IN ('SMTP', 'BREVO'));

ALTER TABLE contact_history DROP CONSTRAINT ck_contact_history_type;

ALTER TABLE contact_history
  ADD CONSTRAINT ck_contact_history_type
  CHECK (type IN ('RECEIVED', 'READ', 'REPLIED', 'CONFIRMATION'));
