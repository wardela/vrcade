const { assertModulePermission } = require("../services/permissionService");

const requireModulePermission = (moduleName, actions = "view") => {
  return async (req, res, next) => {
    try {
      const userId = Number(req.user?.user_id);

      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({
          code: "AUTH_REQUIRED",
          message: "Authenticated user is missing",
        });
      }

      await assertModulePermission(req.db, userId, moduleName, actions);
      next();
    } catch (error) {
      if (error?.statusCode) {
        return res.status(error.statusCode).json({
          code: error.code,
          message: error.message,
        });
      }

      console.error("Portal permission middleware failed:", error);
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
