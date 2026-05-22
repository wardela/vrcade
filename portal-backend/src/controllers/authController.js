const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { setTenantSearchPath } = require("../utils/sqlIdentifiers");
const { getUserPermissionsMap } = require("../services/permissionService");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const TOKEN_EXPIRES_IN = process.env.PORTAL_JWT_EXPIRES_IN || "12h";
const INVALID_LOGIN_MESSAGE = "Invalid credentials";

const normalizeText = (value) => {
  if (value == null) {
    return "";
  }

  return String(value).trim();
};

exports.login = async (req, res) => {
  const companyCode = normalizeText(req.body.company_code);
  const portalUsername = normalizeText(req.body.portal_username).toLowerCase();
  const portalPassword =
    typeof req.body.portal_password === "string" ? req.body.portal_password : "";

  if (!companyCode || !portalUsername || !portalPassword) {
    return res.status(400).json({
      message: "company_code, portal_username and portal_password are required",
    });
  }

  const client = await pool.connect();

  try {
    const tenantResult = await client.query(
      `
        SELECT tenant_code, schema_name, active
        FROM public.tenants
        WHERE tenant_code = $1
        LIMIT 1
      `,
      [companyCode]
    );

    if (tenantResult.rowCount === 0 || !tenantResult.rows[0].active) {
      return res.status(401).json({
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    const tenant = tenantResult.rows[0];
    await setTenantSearchPath(client, tenant.schema_name);

    const userResult = await client.query(
      `
        SELECT
          id,
          username,
          full_name,
          portal_access,
          portal_username,
          portal_password_hash,
          portal_notification_email
        FROM users
        WHERE LOWER(portal_username) = LOWER($1)
        LIMIT 1
      `,
      [portalUsername]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    const user = userResult.rows[0];

    if (!user.portal_access || !user.portal_password_hash) {
      return res.status(401).json({
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    const passwordMatches = await bcrypt.compare(
      portalPassword,
      user.portal_password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    const token = jwt.sign(
      {
        type: "portal",
        user_id: user.id,
        schema: tenant.schema_name,
        company_code: tenant.tenant_code,
        portal_username: user.portal_username,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        portal_username: user.portal_username,
        portal_notification_email: user.portal_notification_email,
      },
      tenant: {
        company_code: tenant.tenant_code,
        schema: tenant.schema_name,
      },
    });
  } catch (error) {
    console.error("Portal login error:", error);
    return res.status(500).json({
      message: "Login failed",
    });
  } finally {
    client.release();
  }
};

exports.me = async (req, res) => {
  try {
    const [userResult, companyResult, permissions] = await Promise.all([
      req.db.query(
        `
          SELECT
            id,
            username,
            full_name,
            portal_access,
            portal_username,
            portal_notification_email
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [req.user.user_id]
      ),
      req.db.query(
        `
          SELECT company_name
          FROM company_config
          ORDER BY id DESC
          LIMIT 1
        `
      ),
      getUserPermissionsMap(req.db, req.user.user_id),
    ]);

    if (userResult.rowCount === 0 || userResult.rows[0].portal_access !== true) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = userResult.rows[0];
    const companyName = companyResult.rows[0]?.company_name || null;

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        portal_username: user.portal_username,
        portal_notification_email: user.portal_notification_email,
      },
      tenant: {
        ...req.tenant,
        company_name: companyName,
      },
      permissions,
    });
  } catch (error) {
    console.error("Portal session error:", error);
    return res.status(500).json({
      message: "Failed to load portal session",
    });
  }
};
