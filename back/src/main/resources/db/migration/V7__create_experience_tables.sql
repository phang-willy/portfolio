CREATE TABLE experience_contract_type (
  id UUID PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  lang VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_experience_contract_type_created_at ON experience_contract_type (created_at DESC);
CREATE INDEX idx_experience_contract_type_deleted_at ON experience_contract_type (deleted_at);
CREATE INDEX idx_experience_contract_type_deactivated_at ON experience_contract_type (deactivated_at);
CREATE UNIQUE INDEX uq_experience_contract_type_slug_lang_active
  ON experience_contract_type (slug, lang)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_experience_contract_type_code_active
  ON experience_contract_type (code)
  WHERE deleted_at IS NULL;

CREATE TABLE experience (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL,
  slug VARCHAR(255) NOT NULL,
  year_start SMALLINT NOT NULL,
  year_end SMALLINT,
  role VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  summary VARCHAR(500),
  content TEXT,
  id_experience_contract_type UUID,
  lang VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_experience_contract_type
    FOREIGN KEY (id_experience_contract_type) REFERENCES experience_contract_type (id)
);

CREATE INDEX idx_experience_created_at ON experience (created_at DESC);
CREATE INDEX idx_experience_deleted_at ON experience (deleted_at);
CREATE INDEX idx_experience_deactivated_at ON experience (deactivated_at);
CREATE INDEX idx_experience_id_contract_type ON experience (id_experience_contract_type);
CREATE INDEX idx_experience_group_id ON experience (group_id);
CREATE UNIQUE INDEX uq_experience_slug_active
  ON experience (slug)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_experience_group_lang_active
  ON experience (group_id, lang)
  WHERE deleted_at IS NULL;
