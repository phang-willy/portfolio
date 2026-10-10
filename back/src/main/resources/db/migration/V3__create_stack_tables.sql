CREATE TABLE stack (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE project_stacks (
  id UUID PRIMARY KEY,
  id_project UUID NOT NULL,
  id_stack UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_project_stacks_project
    FOREIGN KEY (id_project) REFERENCES project (id),
  CONSTRAINT fk_project_stacks_stack
    FOREIGN KEY (id_stack) REFERENCES stack (id)
);

CREATE INDEX idx_stack_deleted_at ON stack (deleted_at);
CREATE INDEX idx_project_stacks_id_project ON project_stacks (id_project);
CREATE INDEX idx_project_stacks_id_stack ON project_stacks (id_stack);
CREATE INDEX idx_project_stacks_deleted_at ON project_stacks (deleted_at);
CREATE UNIQUE INDEX uq_project_stacks_active_project_stack
  ON project_stacks (id_project, id_stack)
  WHERE deleted_at IS NULL;
