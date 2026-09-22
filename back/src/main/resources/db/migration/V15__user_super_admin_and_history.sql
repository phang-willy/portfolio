ALTER TABLE "user" DROP CONSTRAINT chk_user_role;

ALTER TABLE "user"
  ADD CONSTRAINT chk_user_role CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'USER'));

CREATE TABLE user_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "user" (id),
  type VARCHAR(40) NOT NULL,
  actor_id UUID REFERENCES "user" (id) ON DELETE SET NULL,
  actor_name VARCHAR(511),
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT ck_user_history_type CHECK (type IN (
    'LOGIN',
    'PASSWORD_RESET_REQUESTED',
    'PASSWORD_CHANGED',
    'EMAIL_CHANGED',
    'ROLE_CHANGED',
    'ACCOUNT_ACTIVATED',
    'ACCOUNT_DEACTIVATED',
    'PROFILE_UPDATED'
  ))
);

CREATE INDEX idx_user_history_user ON user_history (user_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;
