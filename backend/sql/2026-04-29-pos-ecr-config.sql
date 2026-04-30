DO $$
DECLARE
  schema_name text;
BEGIN
  FOR schema_name IN
    SELECT DISTINCT candidate.schema_name
    FROM (
      SELECT 'dev_sales'::text AS schema_name
      UNION
      SELECT tenants.schema_name
      FROM public.tenants
      WHERE tenants.schema_name IS NOT NULL
    ) candidate
  LOOP
    EXECUTE format(
      'ALTER TABLE IF EXISTS %I.pos_points ADD COLUMN IF NOT EXISTS has_ecr BOOLEAN NOT NULL DEFAULT false',
      schema_name
    );

    EXECUTE format(
      'ALTER TABLE IF EXISTS %I.pos_points ADD COLUMN IF NOT EXISTS ecr_mid VARCHAR(120)',
      schema_name
    );

    EXECUTE format(
      'ALTER TABLE IF EXISTS %I.pos_points ADD COLUMN IF NOT EXISTS ecr_tid VARCHAR(120)',
      schema_name
    );

    EXECUTE format(
      'ALTER TABLE IF EXISTS %I.pos_points ADD COLUMN IF NOT EXISTS ecr_secure_key VARCHAR(255)',
      schema_name
    );

    EXECUTE format(
      'ALTER TABLE IF EXISTS %I.company_config ADD COLUMN IF NOT EXISTS ecr_integrator_name VARCHAR(120)',
      schema_name
    );
  END LOOP;
END $$;
