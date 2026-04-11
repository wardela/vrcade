const pool = require("../config/db");

const quoteIdent = (value) => `"${String(value).replace(/"/g, "\"\"")}"`;

const tableRef = (schemaName, tableName) =>
  `${quoteIdent(schemaName)}.${quoteIdent(tableName)}`;

const constraintExists = async (db, schemaName, tableName, constraintName) => {
  const result = await db.query(
    `
      SELECT 1
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE n.nspname = $1
        AND cl.relname = $2
        AND c.conname = $3
      LIMIT 1
    `,
    [schemaName, tableName, constraintName],
  );

  return result.rowCount > 0;
};

const applyPosSessionSchema = async (db, schemaName) => {
  const posSessionsTable = tableRef(schemaName, "pos_sessions");
  const invoiceHeaderTable = tableRef(schemaName, "invoice_header");
  const usersTable = tableRef(schemaName, "users");

  await db.query(`
    CREATE TABLE IF NOT EXISTS ${posSessionsTable} (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      pos CHARACTER VARYING(100) NOT NULL DEFAULT 'POS-1',
      started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMP WITHOUT TIME ZONE NULL,
      status CHARACTER VARYING(20) NOT NULL DEFAULT 'active',
      opening_note TEXT NULL,
      closing_note TEXT NULL,
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    ALTER TABLE ${posSessionsTable}
    ADD COLUMN IF NOT EXISTS closed_via CHARACTER VARYING(20)
  `);

  await db.query(`
    ALTER TABLE ${posSessionsTable}
    ADD COLUMN IF NOT EXISTS closed_by_user_id INTEGER
  `);

  await db.query(`
    ALTER TABLE ${invoiceHeaderTable}
    ADD COLUMN IF NOT EXISTS session_id INTEGER
  `);

  await db.query(`
    ALTER TABLE ${invoiceHeaderTable}
    ADD COLUMN IF NOT EXISTS user_id INTEGER
  `);

  if (
    !(await constraintExists(
      db,
      schemaName,
      "pos_sessions",
      "pos_sessions_status_check",
    ))
  ) {
    await db.query(`
      ALTER TABLE ${posSessionsTable}
      ADD CONSTRAINT pos_sessions_status_check
      CHECK (status IN ('active', 'ended'))
    `);
  }

  if (
    !(await constraintExists(
      db,
      schemaName,
      "pos_sessions",
      "pos_sessions_closed_via_check",
    ))
  ) {
    await db.query(`
      ALTER TABLE ${posSessionsTable}
      ADD CONSTRAINT pos_sessions_closed_via_check
      CHECK (closed_via IS NULL OR closed_via IN ('user', 'admin', 'system'))
    `);
  }

  if (
    !(await constraintExists(
      db,
      schemaName,
      "pos_sessions",
      "pos_sessions_user_id_fkey",
    ))
  ) {
    await db.query(`
      ALTER TABLE ${posSessionsTable}
      ADD CONSTRAINT pos_sessions_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES ${usersTable}(id)
      ON DELETE RESTRICT
    `);
  }

  if (
    !(await constraintExists(
      db,
      schemaName,
      "pos_sessions",
      "pos_sessions_closed_by_user_id_fkey",
    ))
  ) {
    await db.query(`
      ALTER TABLE ${posSessionsTable}
      ADD CONSTRAINT pos_sessions_closed_by_user_id_fkey
      FOREIGN KEY (closed_by_user_id)
      REFERENCES ${usersTable}(id)
      ON DELETE SET NULL
    `);
  }

  if (
    !(await constraintExists(
      db,
      schemaName,
      "invoice_header",
      "invoice_header_session_id_fkey",
    ))
  ) {
    await db.query(`
      ALTER TABLE ${invoiceHeaderTable}
      ADD CONSTRAINT invoice_header_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES ${posSessionsTable}(id)
      ON DELETE SET NULL
    `);
  }

  if (
    !(await constraintExists(
      db,
      schemaName,
      "invoice_header",
      "invoice_header_user_id_fkey",
    ))
  ) {
    await db.query(`
      ALTER TABLE ${invoiceHeaderTable}
      ADD CONSTRAINT invoice_header_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES ${usersTable}(id)
      ON DELETE SET NULL
    `);
  }

  await db.query(`
    CREATE INDEX IF NOT EXISTS pos_sessions_user_id_idx
    ON ${posSessionsTable} (user_id)
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS pos_sessions_one_active_per_user_idx
    ON ${posSessionsTable} (user_id)
    WHERE status = 'active' AND ended_at IS NULL
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS invoice_header_session_id_idx
    ON ${invoiceHeaderTable} (session_id)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS invoice_header_user_id_idx
    ON ${invoiceHeaderTable} (user_id)
  `);
};

const ensureAllPosSessionSchemas = async () => {
  const client = await pool.connect();

  try {
    const schemaResult = await client.query(`
      SELECT DISTINCT schema_name
      FROM (
        SELECT 'dev_sales'::text AS schema_name
        UNION
        SELECT schema_name FROM public.tenants
      ) schemas
      WHERE schema_name IS NOT NULL
      ORDER BY schema_name ASC
    `);

    for (const row of schemaResult.rows) {
      await applyPosSessionSchema(client, row.schema_name);
    }

    console.log(
      `✓ POS session schema ensured for ${schemaResult.rows.length} schema(s)`,
    );
  } finally {
    client.release();
  }
};

module.exports = {
  applyPosSessionSchema,
  ensureAllPosSessionSchemas,
};
