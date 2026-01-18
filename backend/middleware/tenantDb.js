const pool = require("../config/db");

module.exports = async function tenantDb(req, res, next) {
  // 🔴 Schema must come from JWT
  if (!req.user?.schema) {
    return res.status(500).json({
      message: "Tenant schema missing in token"
    });
  }

  let client;

  try {
    client = await pool.connect();

    // ==================================================
    // 1. Validate tenant from PUBLIC schema
    // ==================================================
    const tenantResult = await client.query(
      `
      SELECT active
      FROM public.tenants
      WHERE schema_name = $1
      `,
      [req.user.schema]
    );

    if (tenantResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        message: "Tenant not found"
      });
    }

    const tenant = tenantResult.rows[0];

    // Attach tenant meta (future-proof)
    req.tenant = {
      active: tenant.active
    };

    // ==================================================
    // 2. Enforce active subscription
    // ==================================================
    if (!tenant.active) {
      client.release();
      return res.status(403).json({
        code: "PLAN_EXPIRED",
        message: "Account subscription expired"
      });
    }

    // ==================================================
    // 3. Force schema isolation
    // ==================================================
    await client.query(`SET search_path TO ${req.user.schema}`);

    // ==================================================
    // 4. Attach DB helper (tenant-scoped)
    // ==================================================
    req.db = {
      query: (text, params) => client.query(text, params)
    };

    // ==================================================
    // 5. Release connection automatically
    // ==================================================
    res.on("finish", () => {
      client.release();
    });

    next();

  } catch (err) {
    if (client) client.release();

    console.error("❌ Tenant DB middleware failed:", err);
    res.status(500).json({
      message: "Database routing failed"
    });
  }
};
