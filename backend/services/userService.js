const bcrypt = require("bcryptjs");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERMISSION_MODULES = [
  "dashboard",
  "sales",
  "events",
  "pos",                // ✅ ADD
  "refunds",
  "items",
  "stock_management",
  "clients",
  "reports",
  "users",
  "company_config",
  "einvoicing",
  "receipts",
];

// permissions input expected from frontend:
// permissions: {
//   dashboard: { view:true, add:false, edit:false, delete:false },
//   sales: { view:true, add:true, edit:true, delete:false },
//   ...
// }
const normalizePermissions = (permissions) => {
  const out = {};
  for (const mod of PERMISSION_MODULES) {
    const p = (permissions && permissions[mod]) || {};
    out[mod] = {
      view: !!p.view,
      add: !!p.add,
      edit: !!p.edit,
      delete: !!p.delete,
    };
  }
  return out;
};

const buildPermissionsRows = (userId, permissions) => {
  const p = normalizePermissions(permissions);
  return PERMISSION_MODULES.map((mod) => ({
    user_id: userId,
    module: mod,
    can_view: p[mod].view,
    can_add: p[mod].add,
    can_edit: p[mod].edit,
    can_delete: p[mod].delete,
  }));
};

const buildServiceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeBoolean = (value) => {
  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }

  return Boolean(value);
};

const normalizeText = (value) => {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const normalizePortalUsername = (value) => {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : null;
};

const normalizePortalEmail = (value) => {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const lowered = normalized.toLowerCase();
  if (!EMAIL_PATTERN.test(lowered)) {
    throw buildServiceError("Portal notification email is invalid");
  }

  return lowered;
};

const normalizePortalPassword = (value) =>
  typeof value === "string" ? value : "";

const ensureUniquePortalUsername = async (db, portalUsername, excludeUserId = null) => {
  if (!portalUsername) {
    return;
  }

  const params = [portalUsername];
  let sql = `
    SELECT id
    FROM users
    WHERE LOWER(portal_username) = LOWER($1)
  `;

  if (excludeUserId != null) {
    params.push(excludeUserId);
    sql += ` AND id <> $2`;
  }

  sql += ` LIMIT 1`;

  const existing = await db.query(sql, params);
  if (existing.rowCount > 0) {
    throw buildServiceError("Portal username already exists");
  }
};

const buildPortalCreateConfig = async (db, payload) => {
  const portalAccess = normalizeBoolean(payload.portal_access);

  if (!portalAccess) {
    return {
      portal_access: false,
      portal_username: null,
      portal_password_hash: null,
      portal_notification_email: null,
    };
  }

  const portalUsername = normalizePortalUsername(payload.portal_username);
  const portalPassword = normalizePortalPassword(payload.portal_password);
  const portalNotificationEmail = normalizePortalEmail(
    payload.portal_notification_email
  );

  if (!portalUsername) {
    throw buildServiceError("Portal username is required when portal access is enabled");
  }

  if (portalPassword.length < 6) {
    throw buildServiceError("Portal password must be at least 6 characters");
  }

  await ensureUniquePortalUsername(db, portalUsername);

  return {
    portal_access: true,
    portal_username: portalUsername,
    portal_password_hash: await bcrypt.hash(portalPassword, 10),
    portal_notification_email: portalNotificationEmail,
  };
};

const getUserPortalState = async (db, id) => {
  const result = await db.query(
    `
      SELECT id, portal_access, portal_username, portal_password_hash, portal_notification_email
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  if (result.rowCount === 0) {
    throw buildServiceError("User not found", 404);
  }

  return result.rows[0];
};

const buildPortalUpdateConfig = async (db, id, payload) => {
  const currentUser = await getUserPortalState(db, id);
  const portalAccess = normalizeBoolean(payload.portal_access);

  if (!portalAccess) {
    return {
      portal_access: false,
      portal_username: currentUser.portal_username,
      portal_password_hash: currentUser.portal_password_hash,
      portal_notification_email: currentUser.portal_notification_email,
    };
  }

  const portalUsername =
    normalizePortalUsername(payload.portal_username) ||
    normalizePortalUsername(currentUser.portal_username);
  const portalPassword = normalizePortalPassword(payload.portal_password);
  const portalNotificationEmail = normalizePortalEmail(
    payload.portal_notification_email
  );

  if (!portalUsername) {
    throw buildServiceError("Portal username is required when portal access is enabled");
  }

  const mustSetPortalPassword =
    !currentUser.portal_access || !currentUser.portal_password_hash;

  if (mustSetPortalPassword && portalPassword.length < 6) {
    throw buildServiceError("Portal password must be at least 6 characters");
  }

  if (portalPassword && portalPassword.length < 6) {
    throw buildServiceError("Portal password must be at least 6 characters");
  }

  await ensureUniquePortalUsername(db, portalUsername, id);

  return {
    portal_access: true,
    portal_username: portalUsername,
    portal_password_hash: portalPassword
      ? await bcrypt.hash(portalPassword, 10)
      : currentUser.portal_password_hash,
    portal_notification_email: portalNotificationEmail,
  };
};

exports.createUserWithPermissions = async (db, payload) => {
  try {
    await db.query("BEGIN");

    const { username, password, full_name, permissions } = payload;

    const hashed = await bcrypt.hash(password, 10);
    const portalConfig = await buildPortalCreateConfig(db, payload);

    const createUserSql = `
      INSERT INTO users (
        username,
        password,
        full_name,
        portal_access,
        portal_username,
        portal_password_hash,
        portal_notification_email
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        username,
        full_name,
        portal_access,
        portal_username,
        portal_notification_email,
        (portal_password_hash IS NOT NULL) AS portal_password_configured,
        created_at,
        last_login;
    `;
    const userRes = await db.query(createUserSql, [
      username,
      hashed,
      full_name,
      portalConfig.portal_access,
      portalConfig.portal_username,
      portalConfig.portal_password_hash,
      portalConfig.portal_notification_email,
    ]);
    const user = userRes.rows[0];

    // insert permissions
    const rows = buildPermissionsRows(user.id, permissions);

    // bulk insert
    const values = [];
    const placeholders = [];
    let i = 1;

    for (const r of rows) {
      placeholders.push(
        `($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`
      );
      values.push(
        r.user_id,
        r.module,
        r.can_view,
        r.can_add,
        r.can_edit,
        r.can_delete
      );
    }

    const insertPermSql = `
      INSERT INTO user_permissions
        (user_id, module, can_view, can_add, can_edit, can_delete)
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (user_id, module)
      DO UPDATE SET
        can_view = EXCLUDED.can_view,
        can_add = EXCLUDED.can_add,
        can_edit = EXCLUDED.can_edit,
        can_delete = EXCLUDED.can_delete,
        updated_at = NOW();
    `;
    await db.query(insertPermSql, values);

    await db.query("COMMIT");

    const permissionsMap = await exports.getUserPermissionsMap(db,user.id);
    return { ...user, permissions: permissionsMap };
  } catch (err) {
    await db.query("ROLLBACK");
    if (err.code === "23505" && String(err.constraint || "").includes("portal_username")) {
      throw buildServiceError("Portal username already exists");
    }
    throw err;
  } finally {
    
  }
};

exports.getUserByUsername = async (db,username) => {
  const sql = `SELECT * FROM users WHERE username = $1`;
  const { rows } = await db.query(sql, [username]);
  return rows[0];
};

exports.updateLastLogin = async (db,id) => {
  await db.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [id]);
};

exports.getAllUsers = async (db) => {
  const sql = `
    SELECT
      id,
      username,
      full_name,
      portal_access,
      portal_username,
      portal_notification_email,
      (portal_password_hash IS NOT NULL) AS portal_password_configured,
      created_at,
      last_login
    FROM users
    ORDER BY id ASC
  `;
  const { rows } = await db.query(sql);
  return rows;
};

// returns rows
exports.getUserPermissions = async (db,userId) => {
  const sql = `
    SELECT module, can_view, can_add, can_edit, can_delete
    FROM user_permissions
    WHERE user_id = $1
    ORDER BY module ASC;
  `;
  const { rows } = await db.query(sql, [userId]);
  return rows;
};

// returns map { module: {view, add, edit, delete} }
exports.getUserPermissionsMap = async (db,userId) => {
  const rows = await exports.getUserPermissions(db,userId);

  // ensure all modules exist even if missing in DB
  const map = {};
  for (const mod of PERMISSION_MODULES) {
    map[mod] = { view: false, add: false, edit: false, delete: false };
  }

  for (const r of rows) {
    map[r.module] = {
      view: !!r.can_view,
      add: !!r.can_add,
      edit: !!r.can_edit,
      delete: !!r.can_delete,
    };
  }
  return map;
};

exports.updateUserWithPermissions = async (db, id, payload) => {
  try {
    await db.query("BEGIN");

    const { username, password, full_name, permissions } = payload;
    let hashed = null;
    if (password) hashed = await bcrypt.hash(password, 10);
    const portalConfig = await buildPortalUpdateConfig(db, id, payload);

    const sql = `
      UPDATE users
      SET username = $1,
          full_name = $2,
          password = COALESCE($3, password),
          portal_access = $4,
          portal_username = $5,
          portal_password_hash = $6,
          portal_notification_email = $7
      WHERE id = $8
      RETURNING
        id,
        username,
        full_name,
        portal_access,
        portal_username,
        portal_notification_email,
        (portal_password_hash IS NOT NULL) AS portal_password_configured,
        created_at,
        last_login;
    `;
    const userRes = await db.query(sql, [
      username,
      full_name,
      hashed,
      portalConfig.portal_access,
      portalConfig.portal_username,
      portalConfig.portal_password_hash,
      portalConfig.portal_notification_email,
      id,
    ]);

    if (userRes.rows.length === 0) {
      throw new Error("User not found");
    }

    // if permissions provided, upsert them
    if (permissions) {
      const rows = buildPermissionsRows(id, permissions);

      const values = [];
      const placeholders = [];
      let i = 1;

      for (const r of rows) {
        placeholders.push(
          `($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`
        );
        values.push(
          r.user_id,
          r.module,
          r.can_view,
          r.can_add,
          r.can_edit,
          r.can_delete
        );
      }

      const upsertSql = `
        INSERT INTO user_permissions
          (user_id, module, can_view, can_add, can_edit, can_delete)
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (user_id, module)
        DO UPDATE SET
          can_view = EXCLUDED.can_view,
          can_add = EXCLUDED.can_add,
          can_edit = EXCLUDED.can_edit,
          can_delete = EXCLUDED.can_delete,
          updated_at = NOW();
      `;
      await db.query(upsertSql, values);
    }

    await db.query("COMMIT");

    const user = userRes.rows[0];
    const permissionsMap = await exports.getUserPermissionsMap(db,id);
    return { ...user, permissions: permissionsMap };
  } catch (err) {
    await db.query("ROLLBACK");
    if (err.code === "23505" && String(err.constraint || "").includes("portal_username")) {
      throw buildServiceError("Portal username already exists");
    }
    throw err;
  } finally {
    
  }
};

exports.deleteUser = async (db,id) => {
  // permissions will be deleted automatically because FK ON DELETE CASCADE
  await db.query(`DELETE FROM users WHERE id = $1`, [id]);
  return true;
};
