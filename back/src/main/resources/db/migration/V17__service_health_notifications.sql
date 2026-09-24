CREATE TABLE service_health_state (
  code VARCHAR(64) PRIMARY KEY,
  status VARCHAR(8) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_service_health_state_status CHECK (status IN ('UP', 'DOWN'))
);

CREATE TABLE notification (
  id UUID PRIMARY KEY,
  service_code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_created_at ON notification (created_at DESC, id DESC);

CREATE TABLE notification_read (
  notification_id UUID NOT NULL REFERENCES notification (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id, user_id)
);
