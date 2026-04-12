const ACTION_COLUMN_MAP = {
  view: "can_view",
  add: "can_add",
  edit: "can_edit",
  delete: "can_delete",
};

const createPermissionError = (message, statusCode = 403, code = "MODULE_FORBIDDEN") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const normalizeActions = (actions) => {
  const normalized = Array.isArray(actions) ? actions : [actions];
  const columns = normalized
    .map((action) => ACTION_COLUMN_MAP[action])
    .filter(Boolean);

  if (columns.length === 0) {
    throw createPermissionError("Invalid permission action", 500, "MODULE_PERMISSION_INVALID");
  }

  return columns;
};

const requireModulePermission = (moduleName, actions = "view") => {
  const permissionColumns = normalizeActions(actions);

  return async (req, res, next) => {
    try {
      const userId = Number(req.user?.user_id);

      if (!Number.isInteger(userId) || userId <= 0) {
        throw createPermissionError("Authenticated user is missing", 401, "AUTH_REQUIRED");
      }

      const result = await req.db.query(
        `
          SELECT ${permissionColumns.map((column) => `${column} AS ${column}`).join(", ")}
          FROM user_permissions
          WHERE user_id = $1
            AND module = $2
          LIMIT 1
        `,
        [userId, moduleName],
      );

      const permissionRow = result.rows[0];
      const allowed = permissionColumns.some((column) => permissionRow?.[column] === true);

      if (!allowed) {
        throw createPermissionError(
          "You do not have permission for this action",
          403,
          "MODULE_FORBIDDEN",
        );
      }

      next();
    } catch (error) {
      if (error?.statusCode) {
        return res.status(error.statusCode).json({
          code: error.code,
          message: error.message,
        });
      }

      console.error("Permission middleware failed:", error);
      return res.status(500).json({
        code: "MODULE_PERMISSION_FAILED",
        message: "Permission check failed",
      });
    }
  };
};

module.exports = {
  requireModulePermission,
};
