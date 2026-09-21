CREATE TABLE contact (
  id UUID PRIMARY KEY,
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
  first_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT ck_contact_status CHECK (status IN ('RECEIVED', 'READ', 'REPLIED'))
);

CREATE INDEX idx_contact_created_at ON contact (created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_status ON contact (status) WHERE deleted_at IS NULL;

CREATE TABLE contact_history (
  id UUID PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contact (id),
  type VARCHAR(20) NOT NULL,
  actor_id UUID REFERENCES "user" (id) ON DELETE SET NULL,
  actor_name VARCHAR(511),
  subject VARCHAR(255),
  message TEXT,
  email_queue_id UUID REFERENCES email_queue (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT ck_contact_history_type CHECK (type IN ('RECEIVED', 'READ', 'REPLIED'))
);

CREATE INDEX idx_contact_history_contact ON contact_history (contact_id, created_at, id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_history_email_queue ON contact_history (email_queue_id)
  WHERE email_queue_id IS NOT NULL;
