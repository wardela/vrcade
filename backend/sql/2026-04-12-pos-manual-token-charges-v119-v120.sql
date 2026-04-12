CREATE TABLE IF NOT EXISTS tenant_v_119.pos_manual_token_charges (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  pos_point_id INTEGER NULL,
  user_id INTEGER NOT NULL,
  token_amount INTEGER NOT NULL,
  charged_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('Asia/Amman', NOW()),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('Asia/Amman', NOW()),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('Asia/Amman', NOW())
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'tenant_v_119'
      AND cl.relname = 'pos_manual_token_charges'
      AND c.conname = 'pos_manual_token_charges_token_amount_check'
  ) THEN
    ALTER TABLE tenant_v_119.pos_manual_token_charges
      ADD CONSTRAINT pos_manual_token_charges_token_amount_check
      CHECK (token_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'tenant_v_119'
      AND cl.relname = 'pos_manual_token_charges'
      AND c.conname = 'pos_manual_token_charges_session_id_fkey'
  ) THEN
    ALTER TABLE tenant_v_119.pos_manual_token_charges
      ADD CONSTRAINT pos_manual_token_charges_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES tenant_v_119.pos_sessions(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'tenant_v_119'
      AND cl.relname = 'pos_manual_token_charges'
      AND c.conname = 'pos_manual_token_charges_pos_point_id_fkey'
  ) THEN
    ALTER TABLE tenant_v_119.pos_manual_token_charges
      ADD CONSTRAINT pos_manual_token_charges_pos_point_id_fkey
      FOREIGN KEY (pos_point_id)
      REFERENCES tenant_v_119.pos_points(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'tenant_v_119'
      AND cl.relname = 'pos_manual_token_charges'
      AND c.conname = 'pos_manual_token_charges_user_id_fkey'
  ) THEN
    ALTER TABLE tenant_v_119.pos_manual_token_charges
      ADD CONSTRAINT pos_manual_token_charges_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES tenant_v_119.users(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS pos_manual_token_charges_session_id_idx
  ON tenant_v_119.pos_manual_token_charges (session_id);

CREATE INDEX IF NOT EXISTS pos_manual_token_charges_pos_point_id_idx
  ON tenant_v_119.pos_manual_token_charges (pos_point_id);

CREATE INDEX IF NOT EXISTS pos_manual_token_charges_user_id_idx
  ON tenant_v_119.pos_manual_token_charges (user_id);

CREATE INDEX IF NOT EXISTS pos_manual_token_charges_charged_at_idx
  ON tenant_v_119.pos_manual_token_charges (charged_at DESC, id DESC);


CREATE TABLE IF NOT EXISTS tenant_v120.pos_manual_token_charges (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  pos_point_id INTEGER NULL,
  user_id INTEGER NOT NULL,
  token_amount INTEGER NOT NULL,
  charged_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('Asia/Amman', NOW()),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('Asia/Amman', NOW()),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('Asia/Amman', NOW())
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'tenant_v120'
      AND cl.relname = 'pos_manual_token_charges'
      AND c.conname = 'pos_manual_token_charges_token_amount_check'
  ) THEN
    ALTER TABLE tenant_v120.pos_manual_token_charges
      ADD CONSTRAINT pos_manual_token_charges_token_amount_check
      CHECK (token_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'tenant_v120'
      AND cl.relname = 'pos_manual_token_charges'
      AND c.conname = 'pos_manual_token_charges_session_id_fkey'
  ) THEN
    ALTER TABLE tenant_v120.pos_manual_token_charges
      ADD CONSTRAINT pos_manual_token_charges_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES tenant_v120.pos_sessions(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'tenant_v120'
      AND cl.relname = 'pos_manual_token_charges'
      AND c.conname = 'pos_manual_token_charges_pos_point_id_fkey'
  ) THEN
    ALTER TABLE tenant_v120.pos_manual_token_charges
      ADD CONSTRAINT pos_manual_token_charges_pos_point_id_fkey
      FOREIGN KEY (pos_point_id)
      REFERENCES tenant_v120.pos_points(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'tenant_v120'
      AND cl.relname = 'pos_manual_token_charges'
      AND c.conname = 'pos_manual_token_charges_user_id_fkey'
  ) THEN
    ALTER TABLE tenant_v120.pos_manual_token_charges
      ADD CONSTRAINT pos_manual_token_charges_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES tenant_v120.users(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS pos_manual_token_charges_session_id_idx
  ON tenant_v120.pos_manual_token_charges (session_id);

CREATE INDEX IF NOT EXISTS pos_manual_token_charges_pos_point_id_idx
  ON tenant_v120.pos_manual_token_charges (pos_point_id);

CREATE INDEX IF NOT EXISTS pos_manual_token_charges_user_id_idx
  ON tenant_v120.pos_manual_token_charges (user_id);

CREATE INDEX IF NOT EXISTS pos_manual_token_charges_charged_at_idx
  ON tenant_v120.pos_manual_token_charges (charged_at DESC, id DESC);
