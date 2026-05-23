const pool = require("../config/db");

const TABLE_NAME = "public.landing_contact_submissions";

let ensureTablePromise = null;

const ensureContactSubmissionsTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id BIGSERIAL PRIMARY KEY,
        full_name TEXT NOT NULL CHECK (btrim(full_name) <> ''),
        business_email TEXT NOT NULL CHECK (btrim(business_email) <> ''),
        phone_number TEXT NOT NULL CHECK (btrim(phone_number) <> ''),
        message TEXT NOT NULL CHECK (btrim(message) <> ''),
        locale VARCHAR(10),
        source TEXT NOT NULL DEFAULT 'landing_contact_form',
        user_agent TEXT,
        submitted_from_ip TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS landing_contact_submissions_created_at_idx
        ON ${TABLE_NAME} (created_at DESC);
    `);
  }

  return ensureTablePromise;
};

const insertContactSubmission = async ({
  fullName,
  businessEmail,
  phoneNumber,
  message,
  locale,
  userAgent,
  submittedFromIp,
}) => {
  await ensureContactSubmissionsTable();

  const result = await pool.query(
    `
      INSERT INTO ${TABLE_NAME} (
        full_name,
        business_email,
        phone_number,
        message,
        locale,
        user_agent,
        submitted_from_ip
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `,
    [
      fullName,
      businessEmail,
      phoneNumber,
      message,
      locale,
      userAgent,
      submittedFromIp,
    ]
  );

  return result.rows[0];
};

module.exports = {
  ensureContactSubmissionsTable,
  insertContactSubmission,
};
