const bcrypt = require("bcryptjs");

const PERMISSION_MODULES = [
  "dashboard",
  "sales",
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

exports.createUserWithPermissions = async (db,username, password, full_name, permissions) => {
  try {
    await db.query("BEGIN");

    const hashed = await bcrypt.hash(password, 10);

    const createUserSql = `
      INSERT INTO users (username, password, full_name)
      VALUES ($1, $2, $3)
      RETURNING id, username, full_name, created_at, last_login;
    `;
    const userRes = await db.query(createUserSql, [username, hashed, full_name]);
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
    SELECT id, username, full_name, created_at, last_login
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

exports.updateUserWithPermissions = async (db,id, username, password, full_name, permissions) => {
  try {
    await db.query("BEGIN");

    let hashed = null;
    if (password) hashed = await bcrypt.hash(password, 10);

    const sql = `
      UPDATE users
      SET username = $1,
          full_name = $2,
          password = COALESCE($3, password)
      WHERE id = $4
      RETURNING id, username, full_name, created_at, last_login;
    `;
    const userRes = await db.query(sql, [username, full_name, hashed, id]);

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
    throw err;
  } finally {
    
  }
};

exports.deleteUser = async (db,id) => {
  // permissions will be deleted automatically because FK ON DELETE CASCADE
  await db.query(`DELETE FROM users WHERE id = $1`, [id]);
  return true;
};
