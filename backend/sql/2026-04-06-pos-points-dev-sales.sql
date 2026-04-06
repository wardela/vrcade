CREATE TABLE IF NOT EXISTS dev_sales.pos_points (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(60) NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS dev_sales_pos_points_name_unique_idx
  ON dev_sales.pos_points (name);

CREATE UNIQUE INDEX IF NOT EXISTS dev_sales_pos_points_code_unique_idx
  ON dev_sales.pos_points (code)
  WHERE code IS NOT NULL;

INSERT INTO dev_sales.pos_points (name, is_active, description)
SELECT
  'POS-1',
  true,
  'Default POS station'
WHERE NOT EXISTS (
  SELECT 1
  FROM dev_sales.pos_points
);

INSERT INTO dev_sales.pos_points (name, is_active, description)
SELECT DISTINCT
  COALESCE(NULLIF(BTRIM(ps.pos), ''), 'POS-1') AS name,
  true AS is_active,
  'Imported from existing POS sessions' AS description
FROM dev_sales.pos_sessions ps
WHERE NOT EXISTS (
  SELECT 1
  FROM dev_sales.pos_points pp
  WHERE pp.name = COALESCE(NULLIF(BTRIM(ps.pos), ''), 'POS-1')
);

ALTER TABLE dev_sales.pos_sessions
  ADD COLUMN IF NOT EXISTS pos_point_id INTEGER;

UPDATE dev_sales.pos_sessions ps
SET
  pos_point_id = pp.id,
  pos = pp.name
FROM dev_sales.pos_points pp
WHERE ps.pos_point_id IS NULL
  AND pp.name = COALESCE(NULLIF(BTRIM(ps.pos), ''), 'POS-1');

UPDATE dev_sales.pos_sessions ps
SET
  pos_point_id = fallback.id,
  pos = fallback.name
FROM (
  SELECT id, name
  FROM dev_sales.pos_points
  ORDER BY is_active DESC, id ASC
  LIMIT 1
) fallback
WHERE ps.pos_point_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'dev_sales'
      AND cl.relname = 'pos_sessions'
      AND c.conname = 'pos_sessions_pos_point_id_fkey'
  ) THEN
    ALTER TABLE dev_sales.pos_sessions
      ADD CONSTRAINT pos_sessions_pos_point_id_fkey
      FOREIGN KEY (pos_point_id)
      REFERENCES dev_sales.pos_points(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS dev_sales_pos_sessions_pos_point_id_idx
  ON dev_sales.pos_sessions (pos_point_id);

CREATE INDEX IF NOT EXISTS dev_sales_pos_sessions_pos_point_started_at_idx
  ON dev_sales.pos_sessions (pos_point_id, started_at DESC, id DESC);

CREATE UNIQUE INDEX IF NOT EXISTS dev_sales_pos_sessions_one_active_per_pos_point_idx
  ON dev_sales.pos_sessions (pos_point_id)
  WHERE status = 'active'
    AND ended_at IS NULL
    AND pos_point_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM dev_sales.pos_sessions
    WHERE pos_point_id IS NULL
  ) THEN
    ALTER TABLE dev_sales.pos_sessions
      ALTER COLUMN pos_point_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'dev_sales.pos_sessions.pos_point_id still has NULL values; NOT NULL was not applied.';
  END IF;
END $$;
