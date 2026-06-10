CREATE TABLE "user" (
  id UUID PRIMARY KEY,
  lastname VARCHAR(255) NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMPTZ,
  lock_until TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'USER'))
);

CREATE TABLE password (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_user
    FOREIGN KEY (user_id) REFERENCES "user" (id)
);

CREATE TABLE session (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expired_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id) REFERENCES "user" (id)
);

CREATE TABLE email_verification_token (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expired_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  CONSTRAINT fk_email_verification_token_user
    FOREIGN KEY (user_id) REFERENCES "user" (id)
);

CREATE TABLE two_factor_auth (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  code_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_two_factor_auth_user
    FOREIGN KEY (user_id) REFERENCES "user" (id)
);

CREATE TABLE forgot_password (
  id UUID PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expired_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_queue (
  id UUID PRIMARY KEY,
  recipient VARCHAR(320) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_email_queue_status CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  CONSTRAINT chk_email_queue_attempts CHECK (attempts >= 0)
);

CREATE INDEX idx_user_email ON "user" (email);
CREATE INDEX idx_user_deactivated_at ON "user" (deactivated_at);
CREATE INDEX idx_password_user_id ON password (user_id);
CREATE INDEX idx_session_user_id ON session (user_id);
CREATE INDEX idx_session_token_hash ON session (token_hash);
CREATE INDEX idx_session_expired_at ON session (expired_at);
CREATE INDEX idx_email_verification_token_hash ON email_verification_token (token_hash);
CREATE INDEX idx_email_verification_user_id ON email_verification_token (user_id);
CREATE INDEX idx_two_factor_auth_user_code ON two_factor_auth (user_id, code_hash);
CREATE INDEX idx_two_factor_auth_expired_at ON two_factor_auth (expired_at);
CREATE INDEX idx_forgot_password_token_hash ON forgot_password (token_hash);
CREATE INDEX idx_forgot_password_email ON forgot_password (email);
CREATE INDEX idx_email_queue_pending ON email_queue (status, scheduled_at);
