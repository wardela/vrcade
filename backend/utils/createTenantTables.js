const { applyPosSessionSchema } = require("./ensurePosSessionSchema");
const { assertSafeSqlIdentifier, quoteIdentifier } = require("./sqlIdentifiers");

module.exports = async function createTenantTables(client, newSchema) {
  const sourceSchema = assertSafeSqlIdentifier("dev_sales", "Source schema");
  const targetSchema = assertSafeSqlIdentifier(newSchema, "Tenant schema");

  console.log(`🔧 Creating tenant schema: ${targetSchema}`);

  // 1) Create tenant schema
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(targetSchema, "Tenant schema")};`);

  // 2) Clone TABLES
  await client.query(`
    DO $$
    DECLARE t text;
    BEGIN
      FOR t IN (
        SELECT relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = '${sourceSchema}' AND c.relkind = 'r'
      )
      LOOP
        EXECUTE format(
          'CREATE TABLE %I.%I (LIKE %I.%I INCLUDING ALL);',
          '${targetSchema}', t, '${sourceSchema}', t
        );
      END LOOP;
    END $$;
  `);

  console.log("✓ Tables cloned");

  // 3) Clone SEQUENCES
  await client.query(`
    DO $$
    DECLARE s text;
    BEGIN
      FOR s IN (
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = '${sourceSchema}'
      )
      LOOP
        EXECUTE format('CREATE SEQUENCE %I.%I;', '${targetSchema}', s);
      END LOOP;
    END $$;
  `);

  console.log("✓ Sequences cloned");

  // 4) Fix nextval() defaults
  await client.query(`
    DO $$
    DECLARE tbl text;
    DECLARE col text;
    DECLARE def text;
    DECLARE seqname text;
    DECLARE newseq text;
    BEGIN
      FOR tbl, col, def IN
        SELECT table_name, column_name, column_default
        FROM information_schema.columns
        WHERE table_schema = '${targetSchema}'
          AND column_default LIKE 'nextval(%'
      LOOP
        seqname := regexp_replace(def, '^nextval\\(''([^'']+)''::regclass\\)$', '\\1');
        newseq := '${targetSchema}.' || regexp_replace(seqname, '^[^.]+\\.', '');

        EXECUTE format(
          'ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT nextval(''%s''::regclass);',
          '${targetSchema}', tbl, col, newseq
        );
      END LOOP;
    END $$;
  `);

  console.log("✓ nextval() defaults redirected");

  // 5) Reset all sequences
  await client.query(`
    DO $$
    DECLARE s text;
    BEGIN
      FOR s IN (
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = '${targetSchema}'
      )
      LOOP
        EXECUTE format(
          'SELECT setval(''%I.%I'', 1, false);',
          '${targetSchema}', s
        );
      END LOOP;
    END $$;
  `);

  console.log("✓ Sequences reset");

  // 6) Clone NORMAL FUNCTIONS (non-trigger)
  await client.query(`
    DO $$
    DECLARE fn record;
    DECLARE fn_def text;
    BEGIN
      FOR fn IN
        SELECT p.oid, p.proname, n.nspname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = '${sourceSchema}'
          AND p.oid NOT IN (
            SELECT tgfoid FROM pg_trigger WHERE NOT tgisinternal
          )
      LOOP
        fn_def := pg_get_functiondef(fn.oid);

        fn_def := regexp_replace(
          fn_def,
          '(CREATE( OR REPLACE)? FUNCTION)[[:space:]]+' || fn.nspname || '\\.' || fn.proname,
          '\\1 ${targetSchema}.' || fn.proname,
          'i'
        );

        EXECUTE fn_def;
      END LOOP;
    END $$;
  `);

  console.log("✓ Functions cloned");

  // 7) Clone TRIGGER FUNCTIONS
  await client.query(`
    DO $$
    DECLARE trg record;
    DECLARE fn_oid oid;
    DECLARE fn_def text;
    DECLARE fn_schema text;
    DECLARE fn_name text;
    BEGIN
      FOR trg IN
        SELECT DISTINCT tgfoid
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = '${sourceSchema}'
          AND NOT t.tgisinternal
      LOOP
        fn_oid := trg.tgfoid;

        SELECT proname, n.nspname, pg_get_functiondef(fn_oid)
        INTO fn_name, fn_schema, fn_def
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.oid = fn_oid;

        fn_def := regexp_replace(
          fn_def,
          '(CREATE( OR REPLACE)? FUNCTION)[[:space:]]+' || fn_schema || '\\.' || fn_name,
          '\\1 ${targetSchema}.' || fn_name,
          'i'
        );

        EXECUTE fn_def;
      END LOOP;
    END $$;
  `);

  console.log("✓ Trigger functions cloned");

  // 8) Clone TRIGGERS
  await client.query(`
    DO $$
    DECLARE tg record;
    BEGIN
      FOR tg IN
        SELECT trigger_name, event_manipulation, event_object_table,
               action_timing, action_statement
        FROM information_schema.triggers
        WHERE trigger_schema = '${sourceSchema}'
      LOOP
        EXECUTE format(
          'CREATE TRIGGER %I %s %s ON %I.%I %s',
          tg.trigger_name,
          tg.action_timing,
          tg.event_manipulation,
          '${targetSchema}',
          tg.event_object_table,
          replace(tg.action_statement, '${sourceSchema}.', '${targetSchema}.')
        );
      END LOOP;
    END $$;
  `);

  console.log("✓ Triggers cloned");

  await applyPosSessionSchema(client, targetSchema);
  console.log("✓ POS session schema applied");

  console.log(`🎉 Tenant schema "${targetSchema}" created successfully.`);
};
