const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const tenantDb = require("../middleware/tenantDb");

// =====================================================
// PUBLIC ROUTES (NO AUTH, NO TENANT DB)
// =====================================================

// Multi-tenant login
router.post("/login", userController.login);

// =====================================================
// PROTECTED ROUTES (AUTH + TENANT DB)
// =====================================================

router.use(authMiddleware);
router.use(tenantDb);

// Create user inside tenant
router.post("/register", userController.register);

// Get all users in tenant
router.get("/all", userController.getAll);

// Update user in tenant
router.put("/update/:id", userController.update);

// Delete user in tenant
router.delete("/delete/:id", userController.delete);


router.get("/status", authMiddleware, tenantDb, (req, res) => {
  res.json({
    active: req.tenant.active
  });
});
module.exports = router;
