const pool = require("../config/db");

const TABLE_NAME = "public.landing_offer_requests";

let ensureTablePromise = null;

const ensureOfferRequestsTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id BIGSERIAL PRIMARY KEY,
        full_name TEXT NOT NULL CHECK (btrim(full_name) <> ''),
        business_name TEXT NOT NULL CHECK (btrim(business_name) <> ''),
        phone_number TEXT NOT NULL CHECK (btrim(phone_number) <> ''),
        email TEXT,
        city_location TEXT,
        branch_count INTEGER CHECK (branch_count IS NULL OR branch_count >= 0),
        user_count INTEGER CHECK (user_count IS NULL OR user_count >= 0),
        business_type TEXT NOT NULL CHECK (btrim(business_type) <> ''),
        interested_modules TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        notes TEXT,
        locale VARCHAR(10),
        source TEXT NOT NULL DEFAULT 'landing_pricing_form',
        user_agent TEXT,
        submitted_from_ip TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS landing_offer_requests_created_at_idx
        ON ${TABLE_NAME} (created_at DESC);
    `);
  }

  return ensureTablePromise;
};

const insertOfferRequest = async ({
  fullName,
  businessName,
  phoneNumber,
  email,
  cityLocation,
  branchCount,
  userCount,
  businessType,
  interestedModules,
  notes,
  locale,
  userAgent,
  submittedFromIp,
}) => {
  await ensureOfferRequestsTable();

  const result = await pool.query(
    `
      INSERT INTO ${TABLE_NAME} (
        full_name,
        business_name,
        phone_number,
        email,
        city_location,
        branch_count,
        user_count,
        business_type,
        interested_modules,
        notes,
        locale,
        user_agent,
        submitted_from_ip
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10, $11, $12, $13)
      RETURNING id, created_at
    `,
    [
      fullName,
      businessName,
      phoneNumber,
      email,
      cityLocation,
      branchCount,
      userCount,
      businessType,
      interestedModules,
      notes,
      locale,
      userAgent,
      submittedFromIp,
    ]
  );

  return result.rows[0];
};

module.exports = {
  ensureOfferRequestsTable,
  insertOfferRequest,
};
