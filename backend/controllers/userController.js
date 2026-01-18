const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userService = require("../services/userService");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ==================================================
// LOGIN (MULTI-TENANT — CLINIC STYLE)
// ==================================================
exports.login = async (req, res) => {
  const { tenant_code, username, password, rememberMe } = req.body;


  if (!tenant_code || !username || !password) {
    return res.status(400).json({
      message: "Tenant code, username and password are required"
    });
  }

  const client = await pool.connect();

  try {
    // ==================================================
    // 1. Resolve tenant → schema
    // ==================================================
    const tenantResult = await client.query(
      `
      SELECT schema_name, active
      FROM public.tenants
      WHERE tenant_code = $1
      `,
      [tenant_code]
    );

    if (tenantResult.rowCount === 0) {
      return res.status(401).json({
        message: "Invalid tenant code"
      });
    }

    const { schema_name, active } = tenantResult.rows[0];

    if (!active) {
      return res.status(403).json({
        code: "PLAN_EXPIRED",
        message: "Tenant inactive"
      });
    }

    // ==================================================
    // 2. SET TENANT SCHEMA (CRITICAL)
    // ==================================================
    await client.query(`SET search_path TO ${schema_name}`);

    // ==================================================
    // 3. Fetch user
    // ==================================================
    const userResult = await client.query(
      `
      SELECT id, username, password, full_name
      FROM users
      WHERE username = $1
      `,
      [username]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const user = userResult.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // ==================================================
    // 4. Load permissions
    // ==================================================
    const permResult = await client.query(
      `
      SELECT module, can_view, can_add, can_edit, can_delete
      FROM user_permissions
      WHERE user_id = $1
      `,
      [user.id]
    );

    const permissions = {};
    for (const row of permResult.rows) {
      permissions[row.module] = {
        view: row.can_view,
        add: row.can_add,
        edit: row.can_edit,
        delete: row.can_delete
      };
    }

    // ==================================================
    // 5. Generate JWT (WITH SCHEMA)
    // ==================================================
const tokenDuration = rememberMe ? "30d" : "1d";

const token = jwt.sign(
  {
    user_id: user.id,
    username: user.username,
    schema: schema_name
  },
  JWT_SECRET,
  { expiresIn: tokenDuration }
);


    // ==================================================
    // 6. Update last login
    // ==================================================
    await client.query(
      `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
      `,
      [user.id]
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        permissions
      }
    });

} catch (err) {
  console.error("===== LOGIN ERROR START =====");
  console.error(err);
  console.error("STACK:", err.stack);
  console.error("===== LOGIN ERROR END =====");

  return res.status(500).json({
    message: "Login failed"
  });
} finally {
  client.release();
}

};

// ==================================================
// REGISTER USER (INSIDE TENANT — uses tenantDb)
// ==================================================
exports.register = async (req, res) => {
  try {
    const { username, password, full_name, permissions } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username & password required"
      });
    }

    const user = await userService.createUserWithPermissions(
      req.db,
      username,
      password,
      full_name,
      permissions
    );

    res.status(201).json({
      message: "User created",
      user
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      message: "Error creating user"
    });
  }
};

// ==================================================
// GET ALL USERS (TENANT)
// ==================================================
exports.getAll = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.db);

    const usersWithPerms = await Promise.all(
      users.map(async (u) => {
        const permissions = await userService.getUserPermissionsMap(req.db,u.id);
        return { ...u, permissions };
      })
    );

    res.status(200).json(usersWithPerms);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({
      message: "Error fetching users"
    });
  }
};

// ==================================================
// UPDATE USER (TENANT)
// ==================================================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, full_name, permissions } = req.body;

    const updated = await userService.updateUserWithPermissions(
      req.db,
      id,
      username,
      password,
      full_name,
      permissions
    );

    res.status(200).json({
      message: "Updated",
      user: updated
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({
      message: "Error updating user"
    });
  }
};

// ==================================================
// DELETE USER (TENANT)
// ==================================================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(req.db,id);

    res.status(200).json({
      message: "Deleted"
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({
      message: "Error deleting user"
    });
  }
};
