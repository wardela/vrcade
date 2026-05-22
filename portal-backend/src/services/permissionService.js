const ACTION_COLUMN_MAP = {
  view: "can_view",
  add: "can_add",
  edit: "can_edit",
  delete: "can_delete",
};

const createPermissionError = (
  message,
  statusCode = 403,
  code = "MODULE_FORBIDDEN"
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const getUserPermissionsMap = async (db, userId) => {
  const result = await db.query(
    `
      SELECT module, can_view, can_add, can_edit, can_delete
      FROM user_permissions
      WHERE user_id = $1
    `,
    [userId]
  );

  const permissions = {};

  for (const row of result.rows) {
    permissions[row.module] = {
      view: row.can_view === true,
      add: row.can_add === true,
      edit: row.can_edit === true,
      delete: row.can_delete === true,
    };
  }

  return permissions;
};

const assertModulePermission = async (db, userId, moduleName, actions = "view") => {
  const normalizedActions = Array.isArray(actions) ? actions : [actions];
  const columns = normalizedActions
    .map((action) => ACTION_COLUMN_MAP[action])
    .filter(Boolean);

  if (columns.length === 0) {
    throw createPermissionError(
      "Invalid permission action",
      500,
      "MODULE_PERMISSION_INVALID"
    );
  }

  const result = await db.query(
    `
      SELECT ${columns.map((column) => `${column} AS ${column}`).join(", ")}
      FROM user_permissions
      WHERE user_id = $1
        AND module = $2
      LIMIT 1
    `,
    [userId, moduleName]
  );

  const permissionRow = result.rows[0];
  const allowed = columns.some((column) => permissionRow?.[column] === true);

  if (!allowed) {
    throw createPermissionError("You do not have permission for this action");
  }
};

module.exports = {
  assertModulePermission,
  createPermissionError,
  getUserPermissionsMap,
};
