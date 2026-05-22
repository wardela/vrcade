const pool = require("../config/db");
const { assertSafeSqlIdentifier, setTenantSearchPath } = require("../utils/sqlIdentifiers");

module.exports = async function tenantDb(req, res, next) {
  if (!req.user?.schema) {
    return res.status(401).json({
      message: "Tenant schema missing in token",
    });
  }

  let client;

  try {
    client = await pool.connect();
    const schemaName = assertSafeSqlIdentifier(req.user.schema, "Tenant schema");

    const tenantResult = await client.query(
      `
        SELECT tenant_code, active
        FROM public.tenants
        WHERE schema_name = $1
        LIMIT 1
      `,
      [schemaName]
    );

    if (tenantResult.rowCount === 0) {
      client.release();
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    const tenant = tenantResult.rows[0];

    if (!tenant.active) {
      client.release();
      return res.status(403).json({
        message: "Portal access unavailable",
      });
    }

    await setTenantSearchPath(client, schemaName);

    req.tenant = {
      schema: schemaName,
      company_code: tenant.tenant_code,
      active: tenant.active,
    };

    req.db = {
      query: (text, params) => client.query(text, params),
    };

    let released = false;
    const releaseClient = () => {
      if (released) {
        return;
      }

      released = true;
      client.release();
    };

    res.once("finish", releaseClient);
    res.once("close", releaseClient);

    next();
  } catch (error) {
    if (client) {
      client.release();
    }

    console.error("Portal tenant middleware failed:", error);
    res.status(500).json({
      message: "Database routing failed",
    });
  }
};
