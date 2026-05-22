DO $$
DECLARE
  target_schema text;
BEGIN
  FOR target_schema IN
    SELECT nspname
    FROM pg_namespace
    WHERE nspname <> 'public'
      AND nspname <> 'information_schema'
      AND nspname NOT LIKE 'pg_%'
    ORDER BY nspname
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = target_schema
        AND table_name = 'users'
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = target_schema
          AND table_name = 'users'
          AND column_name = 'portal_access'
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I.users ADD COLUMN portal_access BOOLEAN NOT NULL DEFAULT false',
          target_schema
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = target_schema
          AND table_name = 'users'
          AND column_name = 'portal_username'
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I.users ADD COLUMN portal_username VARCHAR',
          target_schema
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = target_schema
          AND table_name = 'users'
          AND column_name = 'portal_password_hash'
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I.users ADD COLUMN portal_password_hash TEXT',
          target_schema
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = target_schema
          AND table_name = 'users'
          AND column_name = 'portal_notification_email'
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I.users ADD COLUMN portal_notification_email VARCHAR',
          target_schema
        );
      END IF;

      EXECUTE format(
        'CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I.users (LOWER(portal_username)) WHERE portal_username IS NOT NULL',
        'ux_users_portal_username',
        target_schema
      );
    END IF;
  END LOOP;
END $$;
