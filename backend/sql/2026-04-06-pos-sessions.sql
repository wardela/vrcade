DO $$
DECLARE
  target_schema text;
BEGIN
  FOR target_schema IN
    SELECT DISTINCT schema_name
    FROM (
      SELECT 'dev_sales'::text AS schema_name
      UNION
      SELECT schema_name FROM public.tenants
    ) schemas
    WHERE schema_name IS NOT NULL
  LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I.pos_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        pos CHARACTER VARYING(100) NOT NULL DEFAULT ''POS-1'',
        started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMP WITHOUT TIME ZONE NULL,
        status CHARACTER VARYING(20) NOT NULL DEFAULT ''active'',
        opening_note TEXT NULL,
        closing_note TEXT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )',
      target_schema
    );

    EXECUTE format(
      'ALTER TABLE %I.invoice_header
       ADD COLUMN IF NOT EXISTS session_id INTEGER',
      target_schema
    );

    EXECUTE format(
      'ALTER TABLE %I.invoice_header
       ADD COLUMN IF NOT EXISTS user_id INTEGER',
      target_schema
    );

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE n.nspname = target_schema
        AND cl.relname = 'pos_sessions'
        AND c.conname = 'pos_sessions_status_check'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.pos_sessions
         ADD CONSTRAINT pos_sessions_status_check
         CHECK (status IN (''active'', ''ended''))',
        target_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE n.nspname = target_schema
        AND cl.relname = 'pos_sessions'
        AND c.conname = 'pos_sessions_user_id_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.pos_sessions
         ADD CONSTRAINT pos_sessions_user_id_fkey
         FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE RESTRICT',
        target_schema,
        target_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE n.nspname = target_schema
        AND cl.relname = 'invoice_header'
        AND c.conname = 'invoice_header_session_id_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.invoice_header
         ADD CONSTRAINT invoice_header_session_id_fkey
         FOREIGN KEY (session_id) REFERENCES %I.pos_sessions(id) ON DELETE SET NULL',
        target_schema,
        target_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE n.nspname = target_schema
        AND cl.relname = 'invoice_header'
        AND c.conname = 'invoice_header_user_id_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.invoice_header
         ADD CONSTRAINT invoice_header_user_id_fkey
         FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE SET NULL',
        target_schema,
        target_schema
      );
    END IF;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS pos_sessions_user_id_idx
       ON %I.pos_sessions (user_id)',
      target_schema
    );

    EXECUTE format(
      'CREATE UNIQUE INDEX IF NOT EXISTS pos_sessions_one_active_per_user_idx
       ON %I.pos_sessions (user_id)
       WHERE status = ''active'' AND ended_at IS NULL',
      target_schema
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS invoice_header_session_id_idx
       ON %I.invoice_header (session_id)',
      target_schema
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS invoice_header_user_id_idx
       ON %I.invoice_header (user_id)',
      target_schema
    );
  END LOOP;
END $$;
